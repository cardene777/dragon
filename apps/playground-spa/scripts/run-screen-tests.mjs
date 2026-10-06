/**
 * 画面の検査一式 (`default` と `serial`) を、build から server の停止まで 1 命令で回す (#2826)。
 *
 * `playwright.config.ts` は server を起動しないため、起動・接続先・後始末を回す側が毎回組み立てていた。
 * 途中で preview が止まって残りが接続できずに落ちる (#2795 / #2796) か、`PROD_BASE_URL` を渡し忘れて
 * 本番 build を見る 3 spec が繋がらずに落ちた (#2818)。ここで 1 つにまとめる。
 *
 * server に時間の上限を付けず、終わり方 (成功・失敗・中断) を問わず script が止める。
 * port が使用中なら別の port へ逃げずに止まる = 古い版を配る server を見ないため。
 */
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { setTimeout as 待つ } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import { PREVIEW_BASE_URL, PREVIEW_PORT, PREVIEW_URL } from "../ports.ts";

const SPA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT_DIR = resolve(SPA_DIR, "../..");
const READY_TIMEOUT_MS = 120_000;
const STOP_TIMEOUT_MS = 10_000;

let previewProcess;
let previewStartError;
let stopPromise;

/**
 * `lsof` の表から、使用中の process を利用者へ示すための列だけを取り出す。
 * raw の表をそのまま扱わないのは、必要な command と pid を確実に error へ残すため。
 */
export function parseLsofListeners(output) {
  const rows = output.trim().split(/\r?\n/u).slice(1);
  const listeners = rows.flatMap((row) => {
    const [command, pid] = row.trim().split(/\s+/u);
    return command === undefined || pid === undefined ? [] : [{ command, pid }];
  });
  return [
    ...new Map(
      listeners.map((listener) => [`${listener.pid}:${listener.command}`, listener]),
    ).values(),
  ];
}

// pnpm は `pnpm <script> -- <args>` の先頭の `--` も script へ渡すが、
// Playwright はそれを option の終わりとして読むため、先頭にある時だけ取り除く。
export function playwrightArgs(argv) {
  return argv[0] === "--" ? argv.slice(1) : argv;
}

function lsofで調べる(port) {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf8",
  });
  if (result.error?.code === "ENOENT") return undefined;
  if (result.error !== undefined) throw result.error;
  if (result.status === 1) return { free: true, listeners: [], method: "lsof" };
  if (result.status !== 0) {
    throw new Error(`port ${port} を lsof で調べられませんでした: ${result.stderr.trim()}`);
  }

  const listeners = parseLsofListeners(result.stdout);
  if (listeners.length === 0) {
    throw new Error(
      `port ${port} は使用中ですが、lsof の出力から pid と command を読めませんでした`,
    );
  }
  return { free: false, listeners, method: "lsof" };
}

/** `lsof` が無い環境でも、同じ port を bind できるかで使用中かを判定する。 */
function bindで調べる(port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer();
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        resolvePromise({ free: false, listeners: [], method: "bind" });
        return;
      }
      reject(error);
    });
    server.listen({ port, exclusive: true }, () => {
      server.close((error) => {
        if (error === undefined) resolvePromise({ free: true, listeners: [], method: "bind" });
        else reject(error);
      });
    });
  });
}

/** port の検査を 1 箇所に集め、起動前と後始末後で同じ判定を使う。 */
export async function inspectPort(port) {
  return lsofで調べる(port) ?? (await bindで調べる(port));
}

function port使用中の説明(port, inspection) {
  if (inspection.listeners.length > 0) {
    const processes = inspection.listeners
      .map(({ pid, command }) => `pid=${pid} command=${command}`)
      .join("\n");
    return `port ${port} は別の process が使用中です:\n${processes}`;
  }
  return `port ${port} は使用中です (lsof が無いため pid と command は取得できませんでした)`;
}

async function runCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? ROOT_DIR,
    env: options.env ?? process.env,
    stdio: "inherit",
  });
  return new Promise((resolvePromise) => {
    child.once("error", (error) => {
      console.error(`[test:screens] ${command} を起動できませんでした:`, error);
      resolvePromise(1);
    });
    child.once("close", (code, signal) => {
      if (code !== null) resolvePromise(code);
      else resolvePromise(signal === "SIGINT" ? 130 : 1);
    });
  });
}

function startPreview() {
  previewStartError = undefined;
  const child = spawn(
    "pnpm",
    ["exec", "vite", "preview", "--port", String(PREVIEW_PORT), "--strictPort"],
    {
      cwd: SPA_DIR,
      detached: true,
      stdio: "inherit",
    },
  );
  child.once("error", (error) => {
    previewStartError = error;
  });
  return child;
}

async function waitForPreview() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let lastReason = "応答なし";
  while (Date.now() < deadline) {
    if (previewStartError !== undefined) throw previewStartError;
    if (previewProcess?.exitCode !== null && previewProcess?.exitCode !== undefined) {
      throw new Error(`preview server が応答前に exit ${previewProcess.exitCode} で終了しました`);
    }
    try {
      const response = await fetch(PREVIEW_BASE_URL, {
        signal: globalThis.AbortSignal.timeout(1_000),
      });
      lastReason = `HTTP ${response.status}`;
      await response.body?.cancel();
      if (response.status === 200) return;
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);
    }
    await 待つ(250);
  }
  throw new Error(`preview server が 120 秒以内に HTTP 200 を返しませんでした (${lastReason})`);
}

async function waitForPortFree(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  do {
    if ((await inspectPort(PREVIEW_PORT)).free) return true;
    await 待つ(200);
  } while (Date.now() < deadline);
  return false;
}

function signalProcessGroup(pid, signal) {
  try {
    // Vite が孫 process として残らないよう、detached で作った process group 全体へ送る。
    process.kill(-pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

/** 成功・失敗・signal のどの経路が先でも、同じ停止処理を 1 回だけ共有する。 */
async function stopPreviewOnce() {
  if (stopPromise !== undefined) return stopPromise;
  stopPromise = (async () => {
    const child = previewProcess;
    const pid = child?.pid;
    if (pid === undefined) return;

    if (child.exitCode === null) signalProcessGroup(pid, "SIGTERM");
    if (!(await waitForPortFree(STOP_TIMEOUT_MS))) {
      signalProcessGroup(pid, "SIGKILL");
      if (!(await waitForPortFree(2_000))) {
        throw new Error(`preview server を止めた後も port ${PREVIEW_PORT} が使用中です`);
      }
    }
    console.log(
      `[test:screens] preview server を停止し、port ${PREVIEW_PORT} が空いたことを確認しました`,
    );
  })();
  return stopPromise;
}

export async function main(additionalArgs = playwrightArgs(process.argv.slice(2))) {
  const initialPort = await inspectPort(PREVIEW_PORT);
  if (!initialPort.free) throw new Error(port使用中の説明(PREVIEW_PORT, initialPort));

  const buildExit = await runCommand("pnpm", ["run", "build"]);
  if (buildExit !== 0) return buildExit;

  previewProcess = startPreview();
  try {
    await waitForPreview();
    const playwrightEnv = {
      ...process.env,
      SPA_URL: PREVIEW_BASE_URL,
      PROD_BASE_URL: PREVIEW_URL,
    };
    const defaultExit = await runCommand(
      "pnpm",
      ["exec", "playwright", "test", "--project=default", ...additionalArgs],
      { cwd: SPA_DIR, env: playwrightEnv },
    );
    const serialExit = await runCommand(
      "pnpm",
      ["exec", "playwright", "test", "--project=serial", "--no-deps", ...additionalArgs],
      { cwd: SPA_DIR, env: playwrightEnv },
    );
    console.log(`[test:screens] default exit code: ${defaultExit}`);
    console.log(`[test:screens] serial exit code: ${serialExit}`);
    return defaultExit === 0 && serialExit === 0 ? 0 : 1;
  } finally {
    await stopPreviewOnce();
  }
}

function finishAfterCleanup(exitCode, error) {
  if (error !== undefined) console.error("[test:screens]", error);
  void stopPreviewOnce()
    .catch((cleanupError) =>
      console.error("[test:screens] preview server の停止に失敗しました:", cleanupError),
    )
    .finally(() => process.exit(exitCode));
}

function installTerminationHandlers() {
  process.once("SIGINT", () => finishAfterCleanup(130));
  process.once("SIGTERM", () => finishAfterCleanup(143));
  process.once("uncaughtException", (error) => finishAfterCleanup(1, error));
}

const isEntryPoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isEntryPoint) {
  installTerminationHandlers();
  void main().then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
    (error) => finishAfterCleanup(1, error),
  );
}
