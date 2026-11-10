/**
 * 書き出しを jsdom の外の thread で回す道具 (#3560、#3602)。
 *
 * jsdom で動く検査の file では、大域の `Uint8Array` が jsdom の物に替わるので、字の file を削る wasm が Node の `Buffer` を断る。
 * 書き出しは別の thread で、Node の大域のまま動かす。書き出しの入口 (`dist/export.js`) は thread で 1 度だけ読み、件ごとに読み直さない。
 * thread は読んだ file の終わりに止める。
 * thread の中では Chromium を 1 度だけ起こし、2 回目からの書き出しは同じ Chromium を借りる (`shared-chromium.ts` の `lendThreadChromium`)。
 * 書き出すたびに起こすと、混んだ機械で PNG を 2 回書き出す件が 1 件の上限 (10 秒) を超えた (#3602)。
 * thread を作り、書き出しの入口を読み、Chromium を起こす段は、書き出す件の前の準備 (`beforeAll`) で `warmThread` を呼んで済ませる。
 * 1 回だけ書き出す file でも、件の中では書き出す分だけを待つ。
 * thread の中で Chromium を起こした回数と書き出した回数は `threadStats` で読む
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";
import { afterAll } from "vitest";
import type { Json } from "./diagram-support";
import type { ExportOptions } from "./export-support";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * thread の中身。Chromium を貸す形に差し替えてから、頼まれた原本を書き出して file の path を返す。
 * 数を頼まれたら、Chromium を起こした回数と書き出した回数を返す。準備を頼まれたら、書き出しの入口を読んで Chromium を起こしておく。
 * `shared-chromium.ts` は vitest を通さず、Node が型だけを外して読む
 */
const EXPORT_THREAD = `
const { parentPort } = require("node:worker_threads");
let written = 0;
const lending = import(${JSON.stringify(pathToFileURL(join(ROOT, "packages/dragon/test/shared-chromium.ts")).href)}).then(async (shared) => {
  await shared.lendThreadChromium();
  return shared;
});
const entry = import(${JSON.stringify(pathToFileURL(join(ROOT, "packages/dragon/dist/export.js")).href)});
parentPort.on("message", async ({ id, diagram, options, stats, warm }) => {
  try {
    const shared = await lending;
    if (warm) {
      await entry;
      await shared.warmThreadChromium();
      parentPort.postMessage({ id, warmed: true });
      return;
    }
    if (stats) {
      parentPort.postMessage({ id, stats: { launches: shared.threadChromiumLaunches(), exports: written } });
      return;
    }
    const { exportDiagram } = await entry;
    written++;
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
  warmed?: true;
  error?: string;
}

let thread: Worker | undefined;
/** 頼んだ番号。上限で止まった件の返事を、次の件の返事と取り違えない */
let asked = 0;
afterAll(async () => {
  await thread?.terminate();
});

/** thread に頼み、同じ番号の返事を待つ */
function ask(message: { diagram: Json; options: ExportOptions } | { stats: true } | { warm: true }): Promise<Reply> {
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

/** thread を作り、書き出しの入口を読み、Chromium を起こしておく。書き出す件の前の準備 (`beforeAll`) で呼ぶ */
export async function warmThread(): Promise<void> {
  const reply = await ask({ warm: true });
  if (!reply.warmed) throw new Error(`書き出しの thread を用意できない ${reply.error ?? ""}`);
}
