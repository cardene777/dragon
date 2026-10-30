/**
 * 編集画面で字の重なりを知らせる (#3178)。
 *
 * 書いた図に字の重なりがある時、書く欄の下の知らせの欄に「読めています」と並べて重なりの欄を出し、重なりを段の札と文で 1 件 1 行で並べる。
 * 今の段で重なる字は図の上で点線の四角で囲み、段の札を押すとその段へ移る。
 * 囲みと段へ移る動きは再生の部品が持ち、頁の側では SVG を組まない。
 *
 * 線の無い段の番号を箱の角に置いてから (#3187)、記法と JSON で組んだ 6000 図以上で字の重なる図が 1 つも出ず、書く図を作れない。
 * そこで重なりの欄と囲みと段へ移る動きは、検査だけの build (`overlap-build.config.ts`) を開いて確かめる (#3197)。
 * その build は重なりを探す所だけを包み、2 段目に図に描いた 2 つの字を組にした重なりを 1 件足す (`packages/dragon/test/paired-overlap.ts`)。
 * 重ならない見本で何も出さないことは、本番と同じ build を開いて確かめ、包みが本番の build に入らないことの守りも兼ねる。
 * 知らせる文と、囲みと段へ移る再生の部品の呼び出しは `packages/dragon/test/overlap-notice.test.ts` が確かめる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { app, BASE, root, type Site, startSite } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 頁の振る舞いを 1 つ確かめるのに許す時間 */
const SLOW = 90_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

const EDITOR = `${BASE}editor`;

/**
 * 2 段目に書き込みだけを持つ状態遷移図。通らない箱「支払い済み」を脇道の囲みに入れ、囲みの名前と添え書きを描く。
 * 検査だけの build では、2 段目に見えている字から描いた順に、添え書きと囲みの名前が重なりの組になる
 */
const OVERLAPPING = readFileSync(join(root, "packages/dragon/test/fixtures/corner-note.dragon"), "utf8");
/** 日本語の頁で組になる 2 つの字 */
const PAIRED = ["今回は通らない", "脇道"] as const;

type Rect = { x: number; y: number; w: number; h: number };

const sel = (name: string): string => `[data-playground="${name}"]`;

/** 本番と同じ build と、重なりを 1 件足す検査だけの build */
let site: Site | undefined;
let paired: Site | undefined;

async function openWith(on: Site | undefined, text: string | null, locale = "ja-JP"): Promise<Page> {
  if (!on) throw new Error("頁が起きていない");
  const { page } = await on.open({ path: EDITOR, locale });
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

/** 重なりの欄の 1 行ごとの、段の札と文 */
const listed = (page: Page): Promise<string[][]> =>
  page.evaluate((s) => [...document.querySelectorAll(`${s.list} ${s.item}`)].map((li) => [li.querySelector(s.step)?.textContent ?? "", li.querySelector(s.text)?.textContent ?? ""]), {
    list: sel("overlaps"),
    item: sel("overlap"),
    step: sel("overlap-step"),
    text: sel("overlap-text"),
  });

/** 図の下の段の札 (「段 1 / 2」) */
const phase = (page: Page): Promise<string> => page.locator(sel("phase-badge")).innerText();

/**
 * 図に描いた字のうち、名前が `names` のどれかに当たる字で、どの点線の四角にも覆われない字の名前。
 * 字の範囲は、頁が字に当てた書体で字の形を測り (`measureText`)、字の置き場所から画面の上の四角にして比べる。
 * 字の要素の四角 (`getBoundingClientRect`) は字の上下の余白まで含むので使わず、重なりの記録に書いた四角にも頼らない
 */
const uncovered = (page: Page, names: readonly string[]): Promise<string[]> =>
  page.evaluate(
    async ({ figure, wanted }) => {
      await document.fonts.ready;
      const context = document.createElement("canvas").getContext("2d");
      if (!context) return ["字を測る canvas が無い"];
      const glyphs = (t: SVGTextElement): DOMRect => {
        const style = getComputedStyle(t);
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        context.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
        const m = context.measureText(t.textContent ?? "");
        // 字の頭は左に揃える (`text-anchor: start`)。中と末に揃えた字は送りの幅だけずらす
        const shift = style.textAnchor === "middle" ? m.width / 2 : style.textAnchor === "end" ? m.width : 0;
        const x = Number(t.getAttribute("x")) - shift;
        const y = Number(t.getAttribute("y"));
        const screen = t.getScreenCTM() ?? undefined;
        const a = new DOMPoint(x - m.actualBoundingBoxLeft, y - m.actualBoundingBoxAscent).matrixTransform(screen);
        const b = new DOMPoint(x + m.actualBoundingBoxRight, y + m.actualBoundingBoxDescent).matrixTransform(screen);
        return new DOMRect(a.x, a.y, b.x - a.x, b.y - a.y);
      };
      const spots = [...document.querySelectorAll(`${figure} rect.dg-spot`)].map((m) => m.getBoundingClientRect());
      const texts = [...document.querySelectorAll<SVGTextElement>(`${figure} svg text`)].filter((t) => wanted.includes(t.textContent ?? ""));
      const inside = (outer: DOMRect, inner: DOMRect): boolean =>
        outer.left <= inner.left && outer.top <= inner.top && outer.right >= inner.right && outer.bottom >= inner.bottom;
      const missing = wanted.filter((name) => !texts.some((t) => t.textContent === name)).map((name) => `${name} (図に描かれていない)`);
      const bare = texts.filter((t) => !spots.some((spot) => inside(spot, glyphs(t)))).map((t) => t.textContent ?? "");
      return [...missing, ...bare];
    },
    { figure: sel("figure"), wanted: [...names] },
  );

/** 段を `n` 回進める */
async function forward(page: Page, n: number): Promise<void> {
  for (let i = 0; i < n; i++) await page.locator(`${sel("stage")} [data-dragon="next"]`).click();
}

describe("編集画面で字の重なりを知らせる (#3178)", () => {
  beforeAll(async () => {
    site = await startSite();
    paired = await startSite({ config: join(app, "src/lib/overlap-build.config.ts") });
  }, SETUP);

  afterEach(async () => {
    await site?.closeContexts();
    await paired?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
    await paired?.close();
  }, TEARDOWN);

  it(
    "editor-lists-overlaps",
    async () => {
      const ja = await openWith(paired, OVERLAPPING);
      await expect.poll(() => ja.locator(sel("overlaps")).count(), { ...WAIT, message: "重なりの欄が出ない" }).toBe(1);
      expect(await ja.locator(".pg-ok").innerText(), "重なりの欄と並んで「読めています」が出ない").toContain("読めています");
      expect(await ja.locator(sel("overlaps-count")).innerText()).toBe("字の重なり 1 件");
      expect(await listed(ja)).toEqual([["段 2", "「今回は通らない」と「脇道」が重なる"]]);

      const en = await openWith(paired, OVERLAPPING, "en-US");
      await expect.poll(() => en.locator(sel("overlaps")).count(), { ...WAIT, message: "英語の頁に重なりの欄が出ない" }).toBe(1);
      expect(await en.locator(sel("overlaps-count")).innerText()).toBe("1 text overlap");
      expect(await listed(en)).toEqual([["Step 2", '"Not taken this time" and "Side path" overlap']]);
    },
    SLOW,
  );

  it(
    "editor-marks-overlaps-on-figure",
    async () => {
      const page = await openWith(paired, OVERLAPPING);
      await expect.poll(() => phase(page), { ...WAIT, message: "1 段目に止まらない" }).toContain("段 1 / 2");
      expect(await marks(page), "重なりの無い段で図の上に四角が出た").toEqual([]);
      await forward(page, 1);
      await expect.poll(() => phase(page), { ...WAIT, message: "2 段目へ進まない" }).toContain("段 2 / 2");
      await expect.poll(() => marks(page).then((m) => m.length), { ...WAIT, message: "重なりの段で図の上に四角が出ない" }).toBe(2);
      expect(await uncovered(page, PAIRED), "組にした字を覆う四角が無い").toEqual([]);
      // 囲みは線だけで描き、中の字を隠さない。図の中の別の字と同じ名前の見た目を当てると塗られて字が消える
      const fills = await page.evaluate((f) => [...document.querySelectorAll(`${f} rect.dg-spot`)].map((m) => getComputedStyle(m).fill), sel("figure"));
      expect(fills, "囲みが塗られて中の字を隠す").toEqual(fills.map(() => "none"));
    },
    SLOW,
  );

  it(
    "editor-overlap-step-jumps",
    async () => {
      const page = await openWith(paired, OVERLAPPING);
      await expect.poll(() => phase(page), { ...WAIT, message: "1 段目に止まらない" }).toContain("段 1 / 2");
      await expect.poll(() => page.locator(sel("overlap-step")).count(), { ...WAIT, message: "重なりの欄に段の札が無い" }).toBe(1);
      await page.locator(sel("overlap-step")).click();
      await expect.poll(() => phase(page), { ...WAIT, message: "段の札を押しても 2 段目へ移らない" }).toContain("段 2 / 2");
      await expect.poll(() => marks(page).then((m) => m.length), { ...WAIT, message: "移った段で図の上に四角が出ない" }).toBe(2);
    },
    SLOW,
  );

  it(
    "editor-quiet-without-overlaps",
    async () => {
      const page = await openWith(site, null);
      await expect.poll(() => page.locator(".pg-ok").innerText(), { ...WAIT, message: "「読めています」が出ない" }).toContain("読めています");
      expect(await page.locator(sel("overlaps")).count(), "重ならない見本で重なりの欄が出た").toBe(0);
      expect(await marks(page), "重ならない見本で図の上に四角が出た").toEqual([]);
    },
    SLOW,
  );
});
