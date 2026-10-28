/**
 * 編集画面で字の重なりを知らせる (#3178)。
 *
 * 書いた図に字の重なりがある時、書く欄の下の知らせの欄に「読めています」と並べて重なりの欄を出し、重なりを段の札と文で 1 件 1 行で並べる。
 * 今の段で重なる字は図の上で点線の四角で囲み、段の札を押すとその段へ移る。
 * 囲みと段へ移る動きは再生の部品が持ち、頁の側では SVG を組まない。
 *
 * 字の重なる図は、名前の長い箱へ戻る線を持つ構成図 (`packages/dragon/test/fixtures/self-line.dragon`)。構成図は同じ箱へ戻る線を輪に描かないので、2 段目の番号が箱の名前に重なる。
 * 同じ箱へ戻る線を輪に描く時 (#3186) は、この見本を別の重なる形に替える。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNotation, renderDiagram } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { BASE, root, type Site, startSite } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 頁の振る舞いを 1 つ確かめるのに許す時間 */
const SLOW = 90_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

const EDITOR = `${BASE}editor`;
const OVERLAPPING = readFileSync(join(root, "packages/dragon/test/fixtures/self-line.dragon"), "utf8");

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

/** 重なりの欄に並んだ段の札と文 */
const listed = (page: Page): Promise<string[][]> =>
  page.evaluate((s) => [...document.querySelectorAll(`${s.list} ${s.item}`)].map((li) => [li.querySelector(s.step)?.textContent ?? "", li.querySelector(s.text)?.textContent ?? ""]), {
    list: sel("overlaps"),
    item: sel("overlap"),
    step: sel("overlap-step"),
    text: sel("overlap-text"),
  });

const phase = (page: Page): Promise<string> => page.locator(sel("phase-badge")).innerText();

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

const covers = (outer: Rect, inner: Rect): boolean => outer.x <= inner.x && outer.y <= inner.y && outer.x + outer.w >= inner.x + inner.w && outer.y + outer.h >= inner.y + inner.h;

/** 段を `n` 回進める */
async function forward(page: Page, n: number): Promise<void> {
  for (let i = 0; i < n; i++) await page.locator(`${sel("stage")} [data-dragon="next"]`).click();
}

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
    "editor-lists-overlaps",
    async () => {
      const ja = await openWith(OVERLAPPING);
      await expect.poll(() => ja.locator(sel("overlaps")).count(), { ...WAIT, message: "重なりの欄が出ない" }).toBe(1);
      expect(await ja.locator(".pg-ok").innerText(), "重なりの欄と並んで「読めています」が出ない").toContain("読めています");
      expect(await ja.locator(sel("overlaps-count")).innerText()).toBe("字の重なり 1 件");
      expect(await listed(ja)).toEqual([["段 2", "「注文を受け付ける窓口」と段の番号 2 が重なる"]]);

      const en = await openWith(OVERLAPPING, "en-US");
      await expect.poll(() => en.locator(sel("overlaps")).count(), { ...WAIT, message: "英語の頁に重なりの欄が出ない" }).toBe(1);
      expect(await en.locator(sel("overlaps-count")).innerText()).toBe("1 text overlap");
      expect(await listed(en)).toEqual([["Step 2", '"注文を受け付ける窓口" and step number 2 overlap']]);
    },
    SLOW,
  );

  it(
    "editor-marks-overlaps-on-figure",
    async () => {
      const parsed = parseNotation(OVERLAPPING);
      if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
      const [overlap] = renderDiagram(parsed.diagram).overlaps;
      const spots = overlap?.spots;
      expect(spots, "エンジンの重なりが字の四角を持たない").toBeDefined();

      const page = await openWith(OVERLAPPING);
      await expect.poll(() => phase(page), { ...WAIT, message: "1 段目に止まらない" }).toContain("段 1 / 2");
      expect(await marks(page), "重なりの無い段で図の上に四角が出た").toEqual([]);
      await forward(page, 1);
      await expect.poll(() => phase(page), { ...WAIT, message: "2 段目へ進まない" }).toContain("段 2 / 2");
      await expect.poll(() => marks(page).then((m) => m.length), { ...WAIT, message: "重なりの段で図の上に四角が出ない" }).toBeGreaterThan(0);
      const drawn = await marks(page);
      for (const spot of spots ?? []) expect(drawn.some((m) => covers(m, spot.rect)), `重なる字「${spot.text}」を覆う四角が無い`).toBe(true);
      // 囲みは線だけで描き、中の字を隠さない。図の中の別の字と同じ名前の見た目を当てると塗られて字が消える
      const fills = await page.evaluate((f) => [...document.querySelectorAll(`${f} rect.dg-spot`)].map((m) => getComputedStyle(m).fill), sel("figure"));
      expect(fills, "囲みが塗られて中の字を隠す").toEqual(fills.map(() => "none"));
    },
    SLOW,
  );

  it(
    "editor-overlap-step-jumps",
    async () => {
      const page = await openWith(OVERLAPPING);
      await expect.poll(() => phase(page), { ...WAIT, message: "1 段目に止まらない" }).toContain("段 1 / 2");
      await expect.poll(() => page.locator(sel("overlap-step")).count(), { ...WAIT, message: "重なりの欄に段の札が無い" }).toBe(1);
      await page.locator(sel("overlap-step")).click();
      await expect.poll(() => phase(page), { ...WAIT, message: "段の札を押しても 2 段目へ移らない" }).toContain("段 2 / 2");
      await expect.poll(() => marks(page).then((m) => m.length), { ...WAIT, message: "移った段で図の上に四角が出ない" }).toBeGreaterThan(0);
    },
    SLOW,
  );

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
