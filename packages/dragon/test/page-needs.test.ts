/**
 * `packages/dragon/test/` の検査の file が、Chromium を自分で起こさず、file で 1 つの Chromium を使い回す (#3424)。
 *
 * file で 1 つの Chromium (`page-needs.ts`) は、初めて要った件が起こし、file の process の終わりに止まる。
 * 前後処理で閉じず、頁ごとに起こし直さない。
 * 準備の段で起こす形も試したが、6 つの file を回す全体の時間が初めて要った件が起こす形より長かった。
 *
 * 件の中で Chromium を起こすと、混んだ機械で 1 件 10 秒の上限を超えた (#3816)。
 * 2 度要る仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は返った物と起こした回数を確かめる。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";

const TEST_DIR = join(process.cwd(), "packages/dragon/test");
const source = (name: string): string => readFileSync(join(TEST_DIR, name), "utf8");

/** file で 1 つの Chromium を渡す道具 */
interface FileChromium {
  fileChromium(): Promise<{ version(): string }>;
  fileChromiumLaunches(): number;
}
const NEEDS = "./page-needs";
const fileChromiumTools = async (): Promise<Partial<FileChromium>> => ((await import(/* @vite-ignore */ NEEDS).catch(() => ({}))) as Partial<FileChromium>);

/**
 * 頁を開く道具を自分で持つ file。file で 1 つの Chromium を受け取る。
 * 使う人が足すブロックの頁を開く件は、種類の検査から `user-blocks-cli-checks.ts` へ移し `kind-cli.test.ts` が読む (#3763)
 */
const OWN_PAGES = ["export-support.ts", "interactive-browser.test.ts", "script-entry.test.ts", "user-blocks-cli-checks.ts"];

/** file で 1 つの Chromium を 2 度要った結果。道具が無い時は要らない */
interface Launched {
  fileChromium?: FileChromium["fileChromium"];
  first?: { version(): string };
  second?: { version(): string };
  /** 2 度要った後に Chromium を起こした回数 */
  launches?: number;
}

const LAUNCHED = await atLoad("file で 1 つの Chromium を 2 度要る", async (): Promise<Launched> => {
  const { fileChromium, fileChromiumLaunches } = await fileChromiumTools();
  if (!fileChromium || !fileChromiumLaunches) return { fileChromium };
  const first = await fileChromium();
  const second = await fileChromium();
  return { fileChromium, first, second, launches: fileChromiumLaunches() };
});

describe("file で 1 つの Chromium (#3424)", () => {
  it("package-tests-share-file-chromium", () => {
    const files = readdirSync(TEST_DIR).filter((name) => name.endsWith(".ts") && name !== "page-needs.ts" && name !== "page-needs.test.ts");
    expect(files.length, "検査の file を 1 つも読めない").toBeGreaterThan(10);
    expect(files.filter((name) => /\bchromium\.launch\(/.test(source(name))), "Chromium を自分で起こす file").toEqual([]);
    expect(OWN_PAGES.filter((name) => !/\bfileChromium\(/.test(source(name))), "file で 1 つの Chromium を受け取らない file").toEqual([]);
  });

  it("file-chromium-launches-once", () => {
    const { fileChromium, first, second, launches } = LAUNCHED.get();
    expect(fileChromium, "file で 1 つの Chromium を渡す道具 (page-needs.ts の fileChromium) が無い").toBeTypeOf("function");
    if (launches === undefined) return;
    expect(second, "2 度目に要った時に別の Chromium を返した").toBe(first);
    expect(launches, "file で Chromium を起こした回数").toBe(1);
  });

});
