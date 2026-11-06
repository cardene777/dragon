/**
 * `packages/dragon/test/` の検査の file が、Chromium を自分で起こさず、準備の段が起こした Chromium を使う (#3424)。
 *
 * 準備の段 (`chromium-preload.ts`) は、file を読む前に Chromium を起こし始める。起こすのも閉じるのも 1 件の上限 (10 秒) の外に在る。
 * 起こすかは file の字に、頁を開く道具か準備の段の Chromium を受け取る道具の名前が在るかで決める (`page-needs.ts`)。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { opensPages } from "../../../apps/playground-spa/src/lib/chromium-preload";

const TEST_DIR = join(process.cwd(), "packages/dragon/test");
const source = (name: string): string => readFileSync(join(TEST_DIR, name), "utf8");

/** 頁を開く道具の名前の一覧と見分け方 */
interface PageNeeds {
  PAGE_HELPERS: readonly string[];
  usesChromium(source: string): boolean;
}
const NEEDS = "./page-needs";
const pageNeeds = async (): Promise<PageNeeds | undefined> => (await import(/* @vite-ignore */ NEEDS).catch(() => undefined)) as PageNeeds | undefined;

/** Chromium で頁を開く 6 つの file */
const OPENS = ["export.test.ts", "export-fonts.test.ts", "export-language.test.ts", "interactive-browser.test.ts", "script-entry.test.ts", "user-blocks.test.ts"];
/** 書き出しの検査の道具を読むが、命令か書き出しの関数だけを起こし、頁を開かない file */
const CLI_ONLY = ["arcade-palette.test.ts", "cli-arguments.test.ts", "cli-language.test.ts", "export-leftovers.test.ts", "interactive-diagram.test.ts", "overlap-notice.test.ts"];
/** 頁を開く file のうち、頁を開く道具を自分で持つ file。準備の段の Chromium を受け取る */
const OWN_PAGES = ["export-support.ts", "interactive-browser.test.ts", "script-entry.test.ts", "user-blocks.test.ts"];

describe("準備の段が起こす Chromium (#3424)", () => {
  it("package-tests-use-preloaded-chromium", () => {
    const files = readdirSync(TEST_DIR).filter((name) => name.endsWith(".ts") && name !== "page-needs.test.ts");
    expect(files.length, "検査の file を 1 つも読めない").toBeGreaterThan(10);
    expect(files.filter((name) => /\bchromium\.launch\(/.test(source(name))), "Chromium を自分で起こす file").toEqual([]);
    expect(OWN_PAGES.filter((name) => !/\bpreloadedChromium\(/.test(source(name))), "準備の段の Chromium を受け取らない file").toEqual([]);
  });

  it("package-preload-picks-page-files", () => {
    const path = (name: string): string => join(TEST_DIR, name);
    expect(OPENS.filter((name) => !opensPages(path(name))), "準備の段が Chromium を起こさない、頁を開く file").toEqual([]);
    expect(CLI_ONLY.filter((name) => opensPages(path(name))), "準備の段が Chromium を起こす、頁を開かない file").toEqual([]);
  });

  it("page-helper-names-match-export-support", async () => {
    const needs = await pageNeeds();
    expect(needs?.PAGE_HELPERS, "頁を開く道具の名前の一覧 (page-needs.ts の PAGE_HELPERS) が無い").toBeDefined();
    if (!needs) return;
    // 書き出しの検査の道具のうち、頁を開く道具 (`withPage` か準備の段の Chromium を使う関数) の名前
    const support = source("export-support.ts");
    const opening = [...support.matchAll(/^export async function (\w+)\([^]*?^}/gm)]
      .filter(([body]) => /\bwithPage\(|\bsharedBrowser\(\)/.test(body))
      .map(([, name]) => name);
    expect(opening.length, "書き出しの検査の道具から頁を開く道具を読めない").toBeGreaterThan(5);
    expect(needs.PAGE_HELPERS.filter((name) => name !== "preloadedChromium").sort(), "頁を開く道具の名前の一覧").toEqual(opening.sort());
  });
});
