/**
 * `packages/dragon/test/` の検査の file が画面なしの Chromium を使うかを、file の字から決める (#3424)。
 *
 * 準備の段 (`apps/playground-spa/src/lib/chromium-preload.ts`) が file を読む前に呼び、使う file でだけ Chromium を起こし始める。
 * 使う file は、頁を開く道具 (`export-support.ts`) か、準備の段の Chromium を受け取る道具 (`RECEIVER`) の名前を持つ。
 * 道具の名前の一覧が `export-support.ts` の頁を開く道具と食い違うと、`page-needs.test.ts` が落ちる。
 * 準備の段が読む file なので、Playwright は型だけを読む。
 */
import type { Browser } from "playwright-core";

/** 起こしている Chromium の約束を置く `globalThis` の鍵。準備の段が置き、検査の file が受け取る */
export const PRELOADED_CHROMIUM = Symbol.for("dragon.chromium");

/** 準備の段の Chromium を受け取る道具の名前 */
export const RECEIVER = "preloadedChromium";

/** 名前が file の字に在れば、準備の段が Chromium を起こす道具。頁を開く道具は `export-support.ts` に在る */
export const PAGE_HELPERS: readonly string[] = [
  "captionLayout",
  "captionSteps",
  "decodeFrames",
  "drawnText",
  "miniWorld",
  "playerButtons",
  "playerWords",
  "unfoldedSteps",
  "unreadableFonts",
  RECEIVER,
];

/** 検査の file の字 `source` が、Chromium を使う道具の名前を持つか */
export function usesChromium(source: string): boolean {
  return PAGE_HELPERS.some((name) => new RegExp(`\\b${name}\\b`).test(source));
}

/**
 * 準備の段が起こした Chromium。頁は呼んだ側が文脈 (`newContext`) ごとに開いて閉じ、Chromium は閉じない。
 * Chromium は file の process の終わりに Playwright が止める (`chromium-preload.ts`)。
 * 起こしていない時は、file の字が道具の名前を持たないことを名指して落とす
 */
export function preloadedChromium(): Promise<Browser> {
  const launching = (globalThis as Record<symbol, unknown>)[PRELOADED_CHROMIUM] as Promise<Browser> | undefined;
  if (launching) return launching;
  return Promise.reject(new Error("準備の段 (chromium-preload.ts) が Chromium を起こしていない。検査の file が Chromium を使う道具の名前 (page-needs.ts の PAGE_HELPERS) を持たない"));
}
