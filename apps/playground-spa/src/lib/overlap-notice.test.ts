/**
 * 編集画面で字の重なりを知らせる (#3178)。
 *
 * 書いた図に字の重なりがある時、書く欄の下の知らせの欄に「読めています」と並べて重なりの欄を出し、重なりを段の札と文で 1 件 1 行で並べる。
 * 今の段で重なる字は図の上で点線の四角で囲み、段の札を押すとその段へ移る。
 * 囲みと段へ移る動きは再生の部品が持ち、頁の側では SVG を組まない。
 *
 * 重なる図を書いて欄と囲みと段へ移る動きを確かめる検査は置かない。線の無い段の番号を箱の角に置くと (#3187)、
 * 記法と JSON で組んだ 6000 図以上で字の重なる図が 1 つも出ず、書く図を作れないため。
 * 知らせる文と、囲みと段へ移る再生の部品の呼び出しは `packages/dragon/test/overlap-notice.test.ts` が確かめる。
 */
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { BASE, type Site, startSite } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 頁の振る舞いを 1 つ確かめるのに許す時間 */
const SLOW = 90_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

const EDITOR = `${BASE}editor`;

type Rect = { x: number; y: number; w: number; h: number };

const sel = (name: string): string => `[data-playground="${name}"]`;

let site: Site | undefined;

async function openWith(text: string | null, locale = "ja-JP"): Promise<Page> {
  if (!site) throw new Error("頁が起きていない");
  const { page } = await site.open({ path: EDITOR, locale });
  await expect.poll(() => page.locator(sel("editor")).count(), { ...WAIT, message: "書く欄が無い" }).toBe(1);
  // 動きを減らす設定にすると、書き換えて置き直した図は 1 段目で止まる
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (text !== null) await page.locator(sel("editor")).fill(text);
  await expect.poll(() => page.locator(`${sel("stage")} .dg-player`).count(), { ...WAIT, message: "図が描かれない" }).toBe(1);
  return page;
}

/** 図の上の点線の四角の、図の座標での四角 */
const marks = (page: Page): Promise<Rect[]> =>
  page.evaluate(
    (s) =>
      [...document.querySelectorAll(`${s} rect.dg-spot`)].map((m) => ({
        x: Number(m.getAttribute("x")),
        y: Number(m.getAttribute("y")),
        w: Number(m.getAttribute("width")),
        h: Number(m.getAttribute("height")),
      })),
    sel("figure"),
  );

describe("編集画面で字の重なりを知らせる (#3178)", () => {
  beforeAll(async () => {
    site = await startSite();
  }, SETUP);

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  }, TEARDOWN);

  it(
    "editor-quiet-without-overlaps",
    async () => {
      const page = await openWith(null);
      await expect.poll(() => page.locator(".pg-ok").innerText(), { ...WAIT, message: "「読めています」が出ない" }).toContain("読めています");
      expect(await page.locator(sel("overlaps")).count(), "重ならない見本で重なりの欄が出た").toBe(0);
      expect(await marks(page), "重ならない見本で図の上に四角が出た").toEqual([]);
    },
    SLOW,
  );
});
