/**
 * 書き出しを jsdom の外の thread で回す道具 (#3560、#3602)。
 *
 * jsdom で動く検査の file では、大域の `Uint8Array` が jsdom の物に替わるので、字の file を削る wasm が Node の `Buffer` を断る。
 * 書き出しは別の thread で、Node の大域のまま動かす。書き出しの入口 (`dist/export.js`) は thread で 1 度だけ読み、件ごとに読み直さない。
 * thread は読んだ file の終わりに止める。
 * thread の中で Chromium を起こした回数と書き出した回数は `threadStats` で読む
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { afterAll } from "vitest";
import type { Json } from "./diagram-support";
import type { ExportOptions } from "./export-support";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** thread の中身。頼まれた原本を書き出して file の path を返し、数を頼まれたら Chromium を起こした回数と書き出した回数を返す */
const EXPORT_THREAD = `
const { parentPort } = require("node:worker_threads");
const { createRequire } = require("node:module");
const counted = { launches: 0, exports: 0 };
const { chromium } = createRequire(${JSON.stringify(join(ROOT, "packages/dragon/package.json"))})("playwright-core");
const launch = chromium.launch.bind(chromium);
chromium.launch = (...args) => {
  counted.launches++;
  return launch(...args);
};
const entry = import(${JSON.stringify(pathToFileURL(join(ROOT, "packages/dragon/dist/export.js")).href)});
parentPort.on("message", async ({ id, diagram, options, stats }) => {
  if (stats) {
    parentPort.postMessage({ id, stats: { ...counted } });
    return;
  }
  try {
    const { exportDiagram } = await entry;
    counted.exports++;
    parentPort.postMessage({ id, files: (await exportDiagram(diagram, options)).files });
  } catch (error) {
    parentPort.postMessage({ id, error: String(error?.stack ?? error) });
  }
});
`;

/** thread の中で Chromium を起こした回数と、書き出した回数 */
export interface ThreadStats {
  launches: number;
  exports: number;
}

interface Reply {
  id: number;
  files?: Record<string, string>;
  stats?: ThreadStats;
  error?: string;
}

let thread: Worker | undefined;
/** 頼んだ番号。上限で止まった件の返事を、次の件の返事と取り違えない */
let asked = 0;
afterAll(async () => {
  await thread?.terminate();
});

/** thread に頼み、同じ番号の返事を待つ */
function ask(message: { diagram: Json; options: ExportOptions } | { stats: true }): Promise<Reply> {
  thread ??= new Worker(EXPORT_THREAD, { eval: true });
  const worker = thread;
  const id = ++asked;
  return new Promise((resolve, reject) => {
    const replied = (reply: Reply): void => {
      if (reply.id !== id) return;
      worker.off("message", replied);
      worker.off("error", reject);
      resolve(reply);
    };
    worker.on("message", replied);
    worker.once("error", reject);
    worker.postMessage({ id, ...message });
  });
}

/** 原本を thread で書き出し、形式ごとの file の path を返す */
export async function exportInThread(diagram: Json, options: ExportOptions): Promise<Record<string, string>> {
  const reply = await ask({ diagram, options });
  if (!reply.files) throw new Error(`書き出しの thread で書き出せない ${reply.error ?? ""}`);
  return reply.files;
}

/** thread の中で Chromium を起こした回数と、書き出した回数を読む */
export async function threadStats(): Promise<ThreadStats> {
  const reply = await ask({ stats: true });
  return reply.stats ?? { launches: Number.NaN, exports: Number.NaN };
}
