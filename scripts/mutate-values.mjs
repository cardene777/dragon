/**
 * 値を 1 つずつ書き換えて、検査が落ちるかを確かめる (#3107)。
 *
 * ## 使い方
 *
 * ```
 * pnpm test:mutation:values <変異の一覧> <結果の file> [--wide]
 * ```
 *
 * 一覧の変異を 1 件ずつ、書き換える file の書き換え前の字を書き換え後の字に替えて、名指した検査を回す。
 * 回し終えたら file を HEAD の中身に戻し、落ちた検査の名前を結果の file へ 1 行ずつ足す (JSON Lines)。
 * どの検査も落ちなかった変異が、検査の穴になる。
 * `--wide` では変異の `names` を使わず、`tests` の file の検査を全部回す。
 * 名前で絞った回で落ちなかった変異が、本当にどの検査にも捕まらないかを見る時に使う。
 *
 * 変異の一覧は JSON の配列で書く。
 *
 * ```json
 * [
 *   {
 *     "id": "r1",
 *     "file": "apps/playground-spa/src/editor/fit.ts",
 *     "old": "export const ZOOM_RANGE = [0.25, 4] as const;",
 *     "new": "export const ZOOM_RANGE = [0.25, 8] as const;",
 *     "tests": ["apps/playground-spa/src/lib/playground.test.ts"],
 *     "names": "editor-zoom-stops-at-range|editor-stage-tools-change-view",
 *     "what": "拡大の上限 4 倍を 8 倍"
 *   }
 * ]
 * ```
 *
 * `old` は file の中で 1 か所に決まる字にする。無いか 2 か所以上ある変異は書き換えずに飛ばし、結果に理由を残す。
 * `names` は vitest の `-t` に渡す名前の正規表現で、`null` か省くと絞らない。
 * `what` は人が読む説明で、道具は読まない。
 * `packages/dragon/src` の下を書き換える変異では、検査が `dist` を読むので、検査の前と戻した後に `pnpm build:packages` を回す。
 *
 * 戻す先は HEAD の中身なので、書き換える file に commit していない変更があると消える。
 * 変更を commit してから回す。
 *
 * ## Stryker (`pnpm test:mutation`) では足りない理由
 *
 * Stryker は数の字を書き換える変異を持たない (`[0.25, 4]` を `[]` にはするが `[0.25, 8]` にはしない)。
 * また、変異を切り替える印を検査の process の中 (`globalThis.__stryker__` か `process.env`) にしか置かない。
 * 見本サイトと編集画面の検査は build した頁を画面なしの Chromium で開くので、頁の中の code は印を読めず、
 * 変異を当てても書き換える前の code のまま動く。
 * この道具は source そのものを書き換えるので、build した頁にも変異が入る。
 * #3099 から #3105 では、この道具で 36 の変異を当てた。
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** 書き換えた後に描画の package を build し直す source の置き場 (検査は `dist` を読む) */
const PACKAGE_SOURCE = "packages/dragon/src/";
const FAILED = /^\s*×\s+.*>\s+(\S+)\s+\d+ms$/gm;
const MESSAGE = /AssertionError: (.+?)(?:: expected|$)/gm;

/** 命令を回し、終わり方と出力を返す。起こせなかった時は投げる */
function spawn(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.error) throw r.error;
  return { status: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** 変異の一覧の JSON を読む。1 件でも形が違えば、何件目のどの欄かを名指して投げる */
export function readMutants(text) {
  const list = JSON.parse(text);
  if (!Array.isArray(list)) throw new Error("変異の一覧が配列でない");
  list.forEach((m, i) => {
    const where = `変異の一覧の ${i + 1} 件目${typeof m?.id === "string" ? ` (${m.id})` : ""}`;
    for (const key of ["id", "file", "old", "new"]) {
      if (typeof m?.[key] !== "string") throw new Error(`${where} に "${key}" の字が無い`);
    }
    if (!Array.isArray(m.tests) || m.tests.some((t) => typeof t !== "string")) throw new Error(`${where} の "tests" が file の配列でない`);
    if (m.names !== undefined && m.names !== null && typeof m.names !== "string") throw new Error(`${where} の "names" が字でも null でもない`);
  });
  return list;
}

/** 書き換えた file を HEAD の中身に戻す */
function restore(root, path) {
  const r = spawnSync("git", ["-C", root, "show", `HEAD:${path}`], { maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${path} を HEAD の中身に戻せない: ${String(r.stderr)}`);
  writeFileSync(join(root, path), r.stdout);
}

/** 検査の出力から、落ちた検査の名前と、失敗の文と、集計の行を読む */
function readOutput(text) {
  return {
    summary: text
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.startsWith("Tests ")) ?? "集計なし",
    failed: [...new Set([...text.matchAll(FAILED)].map((x) => x[1]))].sort(),
    messages: [...text.matchAll(MESSAGE)].map((x) => x[1]).slice(0, 3),
  };
}

/**
 * 変異を 1 件ずつ当てて検査を回し、結果の file に 1 行ずつ足して、足した行を返す。
 * `exec` は検査と build の命令を回す所で、検査では差し替える。戻しは `exec` を通さず git で行う。
 * `stopped` が真を返すと、その時の変異を戻した後で次の変異へ進まずに終わる。
 */
export function runMutants({ root, mutants, out, wide = false, exec = spawn, log = console.log, stopped = () => false }) {
  const rows = [];
  const record = (row) => {
    rows.push(row);
    appendFileSync(out, `${JSON.stringify(row)}\n`);
  };
  for (const m of mutants) {
    if (stopped()) break;
    const source = readFileSync(join(root, m.file), "utf8");
    const count = source.split(m.old).length - 1;
    if (count !== 1) {
      const skipped = `書き換える所が 1 か所に決まらない (${count} か所)`;
      record({ id: m.id, skipped });
      log(`${m.id} ${skipped}`);
      continue;
    }
    const pkg = m.file.startsWith(PACKAGE_SOURCE);
    writeFileSync(join(root, m.file), source.replace(m.old, () => m.new));
    let result;
    try {
      if (pkg) exec("pnpm", ["build:packages"], root);
      const names = wide || !m.names ? [] : ["-t", ` (${m.names})$`];
      result = exec("pnpm", ["exec", "vitest", "run", "--reporter=verbose", ...m.tests, ...names], root);
    } finally {
      restore(root, m.file);
      if (pkg) exec("pnpm", ["build:packages"], root);
    }
    const seen = readOutput(result.stdout + result.stderr);
    record({ id: m.id, wide, summary: seen.summary, failed: seen.failed, messages: seen.messages });
    log(`${m.id} ${seen.summary} 落ちた ${seen.failed.join(", ") || "無し"}`);
  }
  return rows;
}

function main(argv) {
  const files = argv.filter((a) => !a.startsWith("--"));
  if (files.length !== 2) {
    console.error("使い方: pnpm test:mutation:values <変異の一覧> <結果の file> [--wide]");
    process.exitCode = 2;
    return;
  }
  // pnpm は repo の root で回すので、渡された path は呼んだ場所 (`INIT_CWD`) から解く
  const from = process.env.INIT_CWD ?? process.cwd();
  const [list, out] = files.map((f) => resolve(from, f));
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  // 止める合図に耳を持つと、Node は検査の命令が終わるまで落ちずに待ち、書き換えた file を戻してから止まる
  let interrupted = false;
  process.on("SIGINT", () => {
    interrupted = true;
    process.exitCode = 130;
  });
  runMutants({ root, mutants: readMutants(readFileSync(list, "utf8")), out, wide: argv.includes("--wide"), stopped: () => interrupted });
  const dirty = spawn("git", ["status", "--porcelain"], root).stdout;
  console.log(`戻した後の差分: ${dirty || "なし"}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(process.argv.slice(2));
