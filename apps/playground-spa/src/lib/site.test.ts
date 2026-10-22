/**
 * サイトの上の帯と 7 画面の経路 (#3030)。
 *
 * 0.35.0 より前のサイトと同じ経路で 7 画面を出し分け、どの画面にも同じ上の帯を載せる。
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 画面は `data-site-screen` の札で見分け、帯の部品は `data-site` の札で探す。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_PALETTE, PALETTES, parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { EXAMPLE_KEYS, exampleText, TEMPLATE } from "../examples";
import { toHash } from "../share";
import { type Lang, TEXT } from "../text";
import { app, BASE, rgb, type Site, startSite } from "./playground-support";

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

/** 前のサイトの値。明るい側は既定の意匠 (活版)、暗い側は同じ色相で地が暗い意匠 (図録) の表 */
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

/** 概要の頁の部品 (#3032) */
const homeSel = (name: string): string => `[data-home="${name}"]`;

/** 概要の 6 区画の並び */
const HOME_SECTIONS = ["hero", "demo", "features", "steps", "uses", "closing"] as const;

/** 実物の窓に出す記法の file。無ければ `undefined` */
const demoText = (lang: Lang): string | undefined => {
  const path = join(app, "src/home", lang === "ja" ? "demo.dragon" : "demo.en.dragon");
  return existsSync(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
};

/** 記法の段ごとの行の範囲 (1 から数える)。段の `#` の行から、次の段の前の空でない行まで */
const stepLines = (text: string): number[][] => {
  const lines = text.split("\n");
  const heads = lines.flatMap((line, i) => (line.startsWith("#") ? [i] : []));
  return heads.map((head, k) => {
    let end = (heads[k + 1] ?? lines.length) - 1;
    while (end > head && (lines[end] ?? "").trim() === "") end--;
    return Array.from({ length: end - head + 1 }, (_, i) => head + i + 1);
  });
};

/** 見本の file の最初の注釈 (`// ` の後ろ) */
const aboutOf = (text: string): string => (text.split("\n")[0] ?? "").replace(/^\/\/\s*/u, "");

/** 実物の窓の書類名と段の札と、記法の行と光っている行の番号 */
const demoOf = (page: Page): Promise<{ file: string; phase: string; code: string; current: number[]; names: string[] } | null> =>
  page.evaluate(() => {
    const demo = document.querySelector('[data-home="demo"]');
    if (!demo) return null;
    const lines = [...demo.querySelectorAll<HTMLElement>('[data-home="demo-code"] [data-line]')];
    const svg = demo.querySelector('svg[data-dragon="figure"]');
    return {
      file: demo.querySelector('[data-home="demo-file"]')?.textContent?.trim() ?? "",
      phase: demo.querySelector('[data-home="demo-phase"]')?.textContent?.trim() ?? "",
      code: lines.map((l) => l.querySelector('[data-home="code-text"]')?.textContent ?? "").join("\n"),
      current: lines.filter((l) => l.dataset.current === "true").map((l) => Number(l.dataset.line)),
      names: svg ? [...new Set([...svg.querySelectorAll(".dg-sn")].map((n) => n.textContent ?? ""))].sort() : [],
    };
  });

/** 用例の札の題と名札と説明と行き先と、縮小版の図の箱の名前と見せ方と動き */
const usesOf = (
  page: Page,
): Promise<{ title: string; kind: string; about: string; href: string; names: string[]; view: string | null; motion: string | null }[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('[data-home="use"]')].map((card) => {
      const svg = card.querySelector('svg[data-dragon="figure"]');
      return {
        title: card.querySelector("h3")?.textContent?.trim() ?? "",
        kind: card.querySelector('[data-home="use-kind"]')?.textContent?.trim() ?? "",
        about: card.querySelector('[data-home="use-about"]')?.textContent?.trim() ?? "",
        href: card.href ? new URL(card.href).pathname : "",
        names: svg ? [...new Set([...svg.querySelectorAll(".dg-sn")].map((n) => n.textContent ?? ""))].sort() : [],
        view: svg?.getAttribute("data-view") ?? null,
        motion: svg?.getAttribute("data-motion") ?? null,
      };
    }),
  );

/** 区画の中の link の行き先。頁の中は path、外は URL */
const linksIn = (page: Page, name: string): Promise<{ text: string; href: string }[]> =>
  page.evaluate(
    (s) =>
      [...document.querySelectorAll<HTMLAnchorElement>(`${s} a`)].map((a) => ({
        text: (a.textContent ?? "").trim(),
        href: new URL(a.href).origin === location.origin ? new URL(a.href).pathname : a.href.replace(/\/$/u, ""),
      })),
    homeSel(name),
  );

/** 概要の図の色 (図の地と字) を、置いた図ごとに */
const homeLooks = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-site-screen="home"] .dg-player')].map((p) => {
      const v = (name: string): string => getComputedStyle(p).getPropertyValue(name).trim().toLowerCase();
      return `${v("--bg")} ${v("--ink")}`;
    }),
  );

/** 見本の題と図の種類と箱の名前 */
const sampleOf = (text: string): { title: string; kind: "sequence" | "architecture"; names: string[] } | undefined => {
  const parsed = parseNotation(text);
  if (!parsed.ok) return undefined;
  const { title, kind, boxes } = parsed.diagram;
  return { title, kind, names: [...new Set(boxes.map((b) => b.name))].sort() };
};

let site: Site;

const screenOf =(page: Page): Promise<string | null> =>
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
          tagline: expect.stringMatching(/\S/u),
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
        .poll(() => page.evaluate(() => document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ?? null), {
          ...WAIT,
          message: "前に共有した URL の記法が書く欄に入らない",
        })
        .toBe(EDITED);
    },
    SLOW,
  );

  it(
    "home-has-six-sections-with-live-diagrams",
    async () => {
      const { page } = await site.open({ path: BASE, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "home", "概要の頁が出ない");

      // 6 区画がこの順で並ぶ
      const sections = (): Promise<(string | null)[]> =>
        page.evaluate(
          (names) => [...document.querySelectorAll("[data-home]")].map((e) => e.getAttribute("data-home")).filter((n) => names.includes(n ?? "")),
          [...HOME_SECTIONS] as string[],
        );
      await expect.poll(sections, { ...WAIT, message: "概要の 6 区画がこの順で並ばない" }).toEqual([...HOME_SECTIONS]);

      // 呼びかけ。見出しと、編集画面と使い方への釦
      expect(await page.locator(`${homeSel("hero")} h1`).count(), "呼びかけに見出しが無い").toBe(1);
      expect(await linksIn(page, "hero"), "呼びかけの釦が編集画面と使い方へ向かない").toEqual([
        { text: "編集画面を開く →", href: `${BASE}editor` },
        { text: "使い方を読む", href: `${BASE}docs` },
      ]);

      // 記法と図の実物。窓の記法が見本の記法で、図はその記法の箱を描き、今の段の行が光る
      const ja = demoText("ja");
      expect(ja, "実物の窓に出す記法の file (src/home/demo.dragon) が無い").toBeDefined();
      const demo = sampleOf(ja ?? "");
      expect(demo, "実物の窓の記法が読めない").toBeDefined();
      const parsed = parseNotation(ja ?? "");
      const steps = parsed.ok ? parsed.diagram.steps : [];
      expect(steps.length, "実物の窓の記法が段を 2 つ以上持たない").toBeGreaterThanOrEqual(2);
      const ranges = stepLines(ja ?? "");
      const phaseOf = (n: number): string => TEXT.ja.stage.phase(n + 1, steps.length, steps[n]?.title ?? "");
      await expect.poll(async () => (await demoOf(page))?.code ?? null, { ...WAIT, message: "実物の窓の記法が見本の記法でない" }).toBe(ja);
      await expect.poll(async () => (await demoOf(page))?.names ?? null, { ...WAIT, message: "実物の窓の図が記法の箱を描かない" }).toEqual(demo?.names);
      const first = await demoOf(page);
      expect(first?.file, "実物の窓に書類名が無い").toMatch(/\.dragon$/u);
      expect(first?.phase, "実物の窓の段の札が最初の段でない").toBe(phaseOf(0));
      expect(first?.current, "実物の窓で最初の段の行が光らない").toEqual(ranges[0]);
      // 図は自分で次の段へ進み、段の札と光る行が付いてくる
      await expect
        .poll(async () => (await demoOf(page))?.phase ?? null, { timeout: 20_000, interval: 200, message: "実物の窓の図が次の段へ進まない" })
        .toBe(phaseOf(1));
      expect((await demoOf(page))?.current, "段が進んでも光る行が替わらない").toEqual(ranges[1]);

      // 特長 3 つ。印と見出しと説明
      const features = await page.evaluate(() =>
        [...document.querySelectorAll('[data-home="feature"]')].map((f) => ({
          icon: f.querySelector('[data-home="feature-icon"]') !== null,
          title: f.querySelector("h3")?.textContent?.trim() ?? "",
          text: f.querySelector("p")?.textContent?.trim() ?? "",
        })),
      );
      expect(features.length, "特長が 3 つ並ばない").toBe(3);
      for (const f of features) expect(f.icon && f.title !== "" && f.text !== "", `特長「${f.title}」に印か見出しか説明が無い`).toBe(true);

      // 3 手順。番号と見出しと説明、2 つ目に新規作成の雛形の抜粋
      const quick = await page.evaluate(() =>
        [...document.querySelectorAll('[data-home="step"]')].map((s) => ({
          no: s.querySelector('[data-home="step-no"]')?.textContent?.trim() ?? "",
          title: s.querySelector("h3")?.textContent?.trim() ?? "",
          code: s.querySelector('[data-home="step-code"]')?.textContent ?? null,
        })),
      );
      expect(quick.map((s) => s.no), "3 手順の番号が 01 から 03 でない").toEqual(["01", "02", "03"]);
      expect(quick.every((s) => s.title !== ""), "3 手順に見出しの無い手順がある").toBe(true);
      expect(quick.map((s) => s.code?.trimEnd() ?? null), "3 手順の 2 つ目だけに新規作成の雛形が出ない").toEqual([null, TEMPLATE.ja, null]);

      // 用例 3 つ。見本ごとに、縮小版の動く図と、図の種類の名札と題と説明。押すとその図の種類の分類へ移る
      const expected = (lang: Lang): { title: string; kind: string; about: string; href: string; names: string[]; view: string; motion: string }[] =>
        EXAMPLE_KEYS.map((key) => {
          const text = exampleText(key, lang);
          const s = sampleOf(text);
          return {
            title: s?.title ?? "",
            kind: s ? TEXT[lang].shelf.kinds[s.kind] : "",
            about: aboutOf(text),
            href: `${BASE}catalog/${s?.kind ?? ""}`,
            names: s?.names ?? [],
            view: "fixed",
            motion: "play",
          };
        });
      await expect.poll(() => usesOf(page), { ...WAIT, message: "用例の札が見本 3 つの図と題と名札と説明を出さない" }).toEqual(expected("ja"));
      expect(await linksIn(page, "uses-more"), "用例の下にカタログへの行き先が無い").toEqual([{ text: "カタログで図を見る →", href: `${BASE}catalog` }]);

      // 最後の呼びかけ。編集画面と GitHub への釦
      expect(await page.locator(`${homeSel("closing")} h2`).count(), "最後の呼びかけに見出しが無い").toBe(1);
      expect(await linksIn(page, "closing"), "最後の呼びかけの釦が編集画面と GitHub へ向かない").toEqual([
        { text: "編集画面を開く →", href: `${BASE}editor` },
        { text: "GitHub ↗", href: REPO },
      ]);

      // 図は頁の明暗に合わせて描かれ、明暗を替えると描き直される
      const looks = (theme: "light" | "dark"): string => {
        const v = PALETTES[DEFAULT_PALETTE]?.[theme] ?? {};
        return `${(v.bg ?? "").toLowerCase()} ${(v.ink ?? "").toLowerCase()}`;
      };
      expect(await homeLooks(page), "概要の図が明るい側の色で描かれない").toEqual(Array(1 + EXAMPLE_KEYS.length).fill(looks("light")));
      await page.locator(siteSel("theme")).click();
      await expect
        .poll(() => homeLooks(page), { ...WAIT, message: "明暗を替えても概要の図が暗い側の色で描き直されない" })
        .toEqual(Array(1 + EXAMPLE_KEYS.length).fill(looks("dark")));

      // 英語に替えると、実物の窓の記法と用例の札が英語の見本になる
      await page.locator(siteSel("lang-en")).click();
      const en = demoText("en");
      expect(en, "実物の窓に出す英語の記法の file (src/home/demo.en.dragon) が無い").toBeDefined();
      await expect.poll(async () => (await demoOf(page))?.code ?? null, { ...WAIT, message: "英語に替えても実物の窓の記法が英語の見本にならない" }).toBe(en);
      await expect.poll(async () => (await demoOf(page))?.names ?? null, { ...WAIT, message: "英語の実物の窓の図が記法の箱を描かない" }).toEqual(sampleOf(en ?? "")?.names);
      await expect.poll(() => usesOf(page), { ...WAIT, message: "英語に替えても用例の札が英語の見本にならない" }).toEqual(expected("en"));

      // 用例の札を押すと、その図の種類の分類の頁へ移る
      const card = page.locator(homeSel("use")).last();
      const href = (await usesOf(page)).at(-1)?.href ?? "";
      await card.click();
      await onScreen(page, "category", "用例の札を押しても分類の頁へ移らない");
      expect(await page.evaluate(() => location.pathname), "用例の札が見本の図の種類の分類へ向かない").toBe(href);
    },
    SLOW,
  );
});
