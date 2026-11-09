/**
 * `packages/dragon/test/` の検査の file が、Chromium を自分で起こさず、file で 1 つの Chromium を使い回す (#3424)。
 *
 * file で 1 つの Chromium (`page-needs.ts`) は、初めて要った件が起こし、file の process の終わりに止まる。
 * 前後処理で閉じず、頁ごとに起こし直さない。
 * 準備の段で起こす形も試したが、6 つの file を回す全体の時間が初めて要った件が起こす形より長かった。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TEST_DIR = join(process.cwd(), "packages/dragon/test");
const source = (name: string): string => readFileSync(join(TEST_DIR, name), "utf8");

/** file で 1 つの Chromium を渡す道具 */
interface FileChromium {
  fileChromium(): Promise<{ version(): string }>;
  fileChromiumLaunches(): number;
}
const NEEDS = "./page-needs";
const fileChromiumTools = async (): Promise<Partial<FileChromium>> => ((await import(/* @vite-ignore */ NEEDS).catch(() => ({}))) as Partial<FileChromium>);

/** 頁を開く道具を自分で持つ file。file で 1 つの Chromium を受け取る */
const OWN_PAGES = ["export-support.ts", "interactive-browser.test.ts", "script-entry.test.ts", "user-blocks.test.ts"];

describe("file で 1 つの Chromium (#3424)", () => {
  it("package-tests-share-file-chromium", () => {
    const files = readdirSync(TEST_DIR).filter((name) => name.endsWith(".ts") && name !== "page-needs.ts" && name !== "page-needs.test.ts");
    expect(files.length, "検査の file を 1 つも読めない").toBeGreaterThan(10);
    expect(files.filter((name) => /\bchromium\.launch\(/.test(source(name))), "Chromium を自分で起こす file").toEqual([]);
    expect(OWN_PAGES.filter((name) => !/\bfileChromium\(/.test(source(name))), "file で 1 つの Chromium を受け取らない file").toEqual([]);
  });

  it("file-chromium-launches-once", async () => {
    const { fileChromium, fileChromiumLaunches } = await fileChromiumTools();
    expect(fileChromium, "file で 1 つの Chromium を渡す道具 (page-needs.ts の fileChromium) が無い").toBeTypeOf("function");
    if (!fileChromium || !fileChromiumLaunches) return;
    const first = await fileChromium();
    const second = await fileChromium();
    expect(second, "2 度目に要った時に別の Chromium を返した").toBe(first);
    expect(fileChromiumLaunches(), "file で Chromium を起こした回数").toBe(1);
  });

});
