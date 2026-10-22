/**
 * サイトの上の帯と 7 画面の経路 (#3030)。
 *
 * 0.35.0 より前のサイトと同じ経路で 7 画面を出し分け、どの画面にも同じ上の帯を載せる。
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 画面は `data-site-screen` の札で見分け、帯の部品は `data-site` の札で探す。
 */
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { toHash } from "../share";
import { BASE, rgb, type Site, startSite } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 画面を 1 つずつ開いて確かめるのに許す時間 */
const SLOW = 120_000;
/** 7 画面を 2 つの幅と明暗で開くのに許す時間 */
const SWEEP = 300_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 (`playground.test.ts` と同じ理由) */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

const siteSel = (name: string): string => `[data-site="${name}"]`;

type Screen = "home" | "catalog" | "category" | "editor" | "docs" | "release-notes" | "not-found";

/** 7 画面と、それを開く経路 */
const SCREENS: readonly (readonly [Screen, string])[] = [
  ["home", BASE],
  ["catalog", `${BASE}catalog`],
  ["category", `${BASE}catalog/sequence`],
  ["editor", `${BASE}editor`],
  ["docs", `${BASE}docs`],
  ["release-notes", `${BASE}release-notes`],
  ["not-found", `${BASE}no-such-page`],
];

const REPO = "https://github.com/cardene777/dragon";

/** 帯の行き先。並びと名前と行き先 */
const DESTINATIONS = [
  { ja: "概要", en: "Home", href: BASE },
  { ja: "カタログ", en: "Catalog", href: `${BASE}catalog` },
  { ja: "編集画面", en: "Editor", href: `${BASE}editor` },
  { ja: "使い方", en: "Docs", href: `${BASE}docs` },
  { ja: "更新履歴", en: "Release notes", href: `${BASE}release-notes` },
  { ja: "GitHub", en: "GitHub", href: REPO },
] as const;

/** 前のサイトの値。明るい側は `letterpress`、暗い側は同じ色相の `catalog` の表 */
const COLORS = {
  light: { bg: "#f6f1e6", surface: "#fffdf7", text: "#2a231d", accent: "#c0421f" },
  dark: { bg: "#1a1611", surface: "#241f18", text: "#f3ece0", accent: "#ee6b3f" },
} as const;

/**
 * 見えている字のうち仮名と漢字を、それを含む字の並びごとに最大 5 つ返す。
 *
 * 書く欄の中身は書き手の記法なので数えない。読み上げの名前 (`aria-label`) は字として見えないので数えない。
 */
const leftover = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const kana = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
    const found: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node && found.length < 5; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || parent.closest("textarea, script, style") || !parent.checkVisibility()) continue;
      const text = node.textContent ?? "";
      if (kana.test(text)) found.push(text.trim());
    }
    return found.join(" | ");
  });

/** 書く欄を確かめる記法 (`playground.test.ts` の `EDITED` と同じ形) */
const EDITED = ["時系列図 書き換えた図", "", "甲 = 甲のサービス", "乙 = 乙のサービス", "", "# 呼ぶ", "> 甲が乙を呼ぶ。", "甲 -> 乙 : 呼ぶ"].join("\n");

let site: Site;

const screenOf = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.querySelector("[data-site-screen]")?.getAttribute("data-site-screen") ?? null);

async function onScreen(page: Page, screen: Screen, message: string): Promise<void> {
  await expect.poll(() => screenOf(page), { ...WAIT, message }).toBe(screen);
}

/** 帯の行き先の名前と行き先と現在地の印。帯が無ければ空 */
const navOf = (page: Page, where = "nav"): Promise<{ text: string; href: string; current: boolean; visible: boolean }[]> =>
  page.evaluate(
    (s) =>
      [...document.querySelectorAll<HTMLAnchorElement>(`${s} a`)].map((a) => ({
        text: (a.textContent ?? "").replace("↗", "").trim(),
        href: new URL(a.href).origin === location.origin ? new URL(a.href).pathname : a.href.replace(/\/$/u, ""),
        current: a.getAttribute("aria-current") === "page",
        visible: a.getClientRects().length > 0 && getComputedStyle(a).visibility !== "hidden",
      })),
    `[data-site="${where}"]`,
  );

/** 帯の印と名前と添え書きと切替と釦 */
const headerOf = (page: Page): Promise<Record<string, string | null>> =>
  page.evaluate(() => {
    const q = (name: string): Element | null => document.querySelector(`[data-site="header"] [data-site="${name}"]`);
    const text = (name: string): string | null => q(name)?.textContent?.trim() ?? null;
    const cta = q("open-editor");
    return {
      mark: q("mark") ? "yes" : null,
      name: text("name"),
      tagline: text("tagline"),
      langJa: q("lang-ja") ? "yes" : null,
      langEn: q("lang-en") ? "yes" : null,
      theme: q("theme") ? "yes" : null,
      cta: text("open-editor"),
      ctaHref: cta instanceof HTMLAnchorElement ? new URL(cta.href).pathname : null,
    };
  });

/** 頁の地、帯の面、字、釦の差し色 */
const colorsOf = (page: Page): Promise<{ bg: string; surface: string; text: string; accent: string }> =>
  page.evaluate(() => {
    const color = (s: string, prop: "backgroundColor" | "color"): string => {
      const e = document.querySelector(s);
      return e ? getComputedStyle(e)[prop] : "";
    };
    return {
      bg: getComputedStyle(document.body).backgroundColor,
      surface: color('[data-site="header"]', "backgroundColor"),
      text: getComputedStyle(document.body).color,
      accent: color('[data-site="header"] [data-site="open-editor"]', "backgroundColor"),
    };
  });

const rgbOf = (c: { bg: string; surface: string; text: string; accent: string }): Record<string, string> =>
  Object.fromEntries(Object.entries(c).map(([k, v]) => [k, rgb(v)]));

describe("サイトの帯と経路 (#3030)", () => {
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
    "site-routes-render-each-screen",
    async () => {
      expect(site.built.notFound.ok, `404.html を作る script が落ちた: ${site.built.notFound.stderr}`).toBe(true);
      for (const [screen, path] of SCREENS) {
        const { page } = await site.open({ path });
        await onScreen(page, screen, `${path} を開いても ${screen} の画面が出ない`);
        expect(await page.evaluate(() => location.pathname), `${path} のアドレスが替わった`).toBe(path);
      }
      // 末尾に `/` の付いた経路も同じ画面を出す
      const slash = await site.open({ path: `${BASE}editor/` });
      await onScreen(slash.page, "editor", "末尾に / の付いた編集画面の経路で編集画面が出ない");
      await expect
        .poll(() => slash.page.evaluate((s) => document.querySelectorAll(s).length, '[data-playground="editor"]'), {
          ...WAIT,
          message: "編集画面に書く欄が無い",
        })
        .toBe(1);
      // カタログの分類より深い経路は見つからない頁にする
      const deep = await site.open({ path: `${BASE}catalog/sequence/extra` });
      await onScreen(deep.page, "not-found", "表に無い深い経路で見つからない頁が出ない");
    },
    SLOW,
  );

  it(
    "site-header-on-every-screen",
    async () => {
      for (const [screen, path] of SCREENS) {
        const { page } = await site.open({ path });
        await onScreen(page, screen, `${path} を開いても ${screen} の画面が出ない`);
        expect(await headerOf(page), `${screen} の帯の部品が足りない`).toEqual({
          mark: "yes",
          name: "dragon",
          tagline: expect.stringMatching(/\S/u) as unknown as string,
          langJa: "yes",
          langEn: "yes",
          theme: "yes",
          cta: "編集画面を開く →",
          ctaHref: `${BASE}editor`,
        });
        const nav = await navOf(page);
        expect(
          nav.map(({ text, href }) => ({ text, href })),
          `${screen} の帯の行き先が 6 つ並ばない`,
        ).toEqual(DESTINATIONS.map(({ ja, href }) => ({ text: ja, href })));
      }
    },
    SLOW,
  );

  it(
    "site-header-marks-current-and-navigates",
    async () => {
      const marked = async (page: Page): Promise<string[]> => (await navOf(page)).filter((n) => n.current).map((n) => n.text);

      const { page } = await site.open({ path: `${BASE}catalog` });
      await onScreen(page, "catalog", "カタログの一覧が出ない");
      expect(await marked(page), "カタログに現在地の印が付かない").toEqual(["カタログ"]);
      // 頁を読み直すと消える印を置き、帯で移った後も残っているかで読み直していないことを見る
      await page.evaluate(() => {
        (window as unknown as { __stay: number }).__stay = 1;
      });
      const stayed = (): Promise<number | undefined> => page.evaluate(() => (window as unknown as { __stay?: number }).__stay);

      await page.locator(`${siteSel("nav")} a`, { hasText: "使い方" }).click();
      await onScreen(page, "docs", "帯の使い方を押しても使い方の頁が出ない");
      expect(await page.evaluate(() => location.pathname)).toBe(`${BASE}docs`);
      expect(await marked(page), "使い方に現在地の印が付かない").toEqual(["使い方"]);
      expect(await stayed(), "帯で移った時に頁を読み直した").toBe(1);

      await page.locator(siteSel("open-editor")).click();
      await onScreen(page, "editor", "編集画面を開く釦で編集画面が出ない");
      expect(await marked(page)).toEqual(["編集画面"]);
      expect(await stayed(), "編集画面を開く釦で頁を読み直した").toBe(1);

      // browser の戻る操作で前の画面へ戻る
      await page.goBack();
      await onScreen(page, "docs", "戻る操作で使い方の頁へ戻らない");
      expect(await marked(page)).toEqual(["使い方"]);
      expect(await stayed(), "戻る操作で頁を読み直した").toBe(1);

      // 分類の頁ではカタログに印を付ける
      const category = await site.open({ path: `${BASE}catalog/sequence` });
      await onScreen(category.page, "category", "カタログの分類の頁が出ない");
      expect(await marked(category.page), "分類の頁でカタログに印が付かない").toEqual(["カタログ"]);
    },
    SLOW,
  );

  it(
    "site-colors-match-previous-site",
    async () => {
      const light = await site.open({ path: BASE, colorScheme: "light" });
      await onScreen(light.page, "home", "概要の頁が出ない");
      await expect.poll(() => colorsOf(light.page), { ...WAIT, message: "明るい側の頁の色が前のサイトの値でない" }).toEqual(rgbOf(COLORS.light));

      // 端末が暗い設定なら暗い側で開く
      const dark = await site.open({ path: BASE, colorScheme: "dark" });
      await onScreen(dark.page, "home", "概要の頁が出ない");
      await expect.poll(() => colorsOf(dark.page), { ...WAIT, message: "暗い側の頁の色が前のサイトの値でない" }).toEqual(rgbOf(COLORS.dark));

      // 明暗の切替を押すと替わり、もう 1 度押すと戻る
      await light.page.locator(siteSel("theme")).click();
      await expect.poll(() => colorsOf(light.page), { ...WAIT, message: "明暗の切替で暗い側にならない" }).toEqual(rgbOf(COLORS.dark));
      await light.page.locator(siteSel("theme")).click();
      await expect.poll(() => colorsOf(light.page), { ...WAIT, message: "明暗の切替で明るい側に戻らない" }).toEqual(rgbOf(COLORS.light));
    },
    SLOW,
  );

  it(
    "site-screens-no-overflow",
    async () => {
      for (const width of [1440, 390]) {
        for (const colorScheme of ["light", "dark"] as const) {
          const { page } = await site.open({ path: BASE, colorScheme, viewport: { width, height: 900 } });
          for (const [screen, path] of SCREENS) {
            await page.goto(`${site.origin}${path}`);
            await onScreen(page, screen, `${path} を開いても ${screen} の画面が出ない`);
            const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            expect(over, `${screen} を幅 ${width}、${colorScheme} で開くと ${over}px 横にあふれる`).toBeLessThanOrEqual(0);
          }
        }
      }
    },
    SWEEP,
  );

  it(
    "site-screens-switch-to-english",
    async () => {
      for (const [screen, path] of SCREENS) {
        const { page } = await site.open({ path, locale: "ja-JP" });
        await onScreen(page, screen, `${path} を開いても ${screen} の画面が出ない`);
        await page.locator(siteSel("lang-en")).click();
        await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${screen} で言語が EN にならない` }).toBe("en");
        await expect
          .poll(() => leftover(page), { ...WAIT, message: `${screen} を EN に切り替えても仮名か漢字が残る` })
          .toBe("");
        const nav = await navOf(page);
        expect(nav.map((n) => n.text), `${screen} の帯の行き先が英語にならない`).toEqual(DESTINATIONS.map((d) => d.en));
      }
    },
    SWEEP,
  );

  it(
    "site-header-folds-at-narrow-width",
    async () => {
      const { page } = await site.open({ path: BASE, viewport: { width: 390, height: 844 } });
      await onScreen(page, "home", "概要の頁が出ない");
      expect((await navOf(page)).some((n) => n.visible), "幅 390 で帯の行き先が畳まれない").toBe(false);
      await page.locator(siteSel("menu")).click();
      await expect
        .poll(async () => (await navOf(page, "sheet")).filter((n) => n.visible).map((n) => n.text), { ...WAIT, message: "開く釦で行き先が出ない" })
        .toEqual(DESTINATIONS.map((d) => d.ja));
      await page.keyboard.press("Escape");
      await expect.poll(async () => (await navOf(page, "sheet")).length, { ...WAIT, message: "Escape で行き先が閉じない" }).toBe(0);

      await page.locator(siteSel("menu")).click();
      await page.locator(`${siteSel("sheet")} a`, { hasText: "使い方" }).click();
      await onScreen(page, "docs", "畳んだ行き先から使い方の頁へ移れない");
      await expect.poll(async () => (await navOf(page, "sheet")).length, { ...WAIT, message: "移った後も行き先が開いたまま" }).toBe(0);
    },
    SLOW,
  );

  it(
    "old-share-link-opens-editor",
    async () => {
      const hash = toHash(EDITED);
      const { page } = await site.open({ path: `${BASE}${hash}` });
      await onScreen(page, "editor", "前に共有した URL を開いても編集画面が出ない");
      expect(await page.evaluate(() => location.pathname), "前に共有した URL のアドレスが編集画面にならない").toBe(`${BASE}editor`);
      expect(await page.evaluate(() => location.hash), "前に共有した URL の # の後ろが消えた").toBe(hash);
      await expect
        .poll(() => page.evaluate(() => (document.querySelector('[data-playground="editor"]') as HTMLTextAreaElement | null)?.value.trimEnd() ?? null), {
          ...WAIT,
          message: "前に共有した URL の記法が書く欄に入らない",
        })
        .toBe(EDITED);
    },
    SLOW,
  );
});
