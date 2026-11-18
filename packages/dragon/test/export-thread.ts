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
 * thread の中で Chromium を起こした回数と書き出した回数は `threadStats` で読む。
 * thread の中身は、準備の段 (#3734) と同じ物を使う (`test-support/prepare-tools.ts` の `ExportThread`)
 */
import { afterAll } from "vitest";
import { type ExportOptions, ExportThread, type ThreadAsk, type ThreadStats } from "../../../test-support/prepare-tools";
import type { Json } from "./diagram-support";

export type { ThreadStats };

let thread: ExportThread | undefined;
afterAll(async () => {
  await thread?.terminate();
});

/** thread に頼み、同じ番号の返事を待つ */
const ask = (message: ThreadAsk): ReturnType<ExportThread["ask"]> => (thread ??= new ExportThread()).ask(message);

/** 原本を thread で書き出し、形式ごとの file の path を返す */
export async function exportInThread(diagram: Json, options: ExportOptions): Promise<Record<string, string>> {
  const reply = await ask({ diagram, options });
  if (!reply.result) throw new Error(`書き出しの thread で書き出せない ${reply.error ?? ""}`);
  return reply.result.files;
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
