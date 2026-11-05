/**
 * サイトの検査の file のうち 2 つ以上が使う道具 (#3381)。
 *
 * サイトの検査は 1 つの file に 111 件を順に並べており、1 つの作業者が順に回すので一式の上限 (5 分) を超えた。
 * 話題ごとの file に分けて別の作業者が同時に回す。1 つの file だけが使う道具はその file に置く。
 * 頁の配り手と、準備の段が起こした Chromium へつないだ線 (`site`) は、検査の file が `useSite()` で用意する。読む側は import した名前のまま使える
 */

import { type Diagram, PALETTES, parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { EXAMPLE_KEYS, type ExampleKey } from "../examples";
import { toHash } from "../share";
import { type Lang, TEXT } from "../text";
import { BASE, example, screenOf, type Site, startSite } from "./playground-support";
import { afterAll, afterEach, beforeAll, expect } from "vitest";

/** 検査の file が開く頁の配り手と Chromium へつないだ線。`useSite()` が file の最初に起こし、最後に閉じる。Chromium そのものは閉じない (#3384) */
export let site: Site;

/** file の検査の前後処理を置く。検査ごとに開いた context を閉じる */
export function useSite(): void {
  beforeAll(async () => {
    site = await startSite();
  });
  afterEach(async () => {
    await site?.closeContexts();
  });
  afterAll(async () => {
    await site?.close();
  });
}

/**
 * 見本の記法。見本の正の file (`packages/dragon/examples`) から読む。
 * 頁の側は概要の頁と編集画面の最初の見本のほかを後から読む塊に分けたので (#3246)、検査は頁の側の見本の表を読まない
 */
export const exampleText = (key: ExampleKey, lang: Lang): string => example(`${key}${lang === "en" ? ".en" : ""}.dragon`) ?? "";

/** 頁が書き換わるのを待つ長さ */
export const WAIT = { timeout: 8_000, interval: 100 } as const;

export const siteSel = (name: string): string => `[data-site="${name}"]`;

export type Screen = "home" | "catalog" | "category" | "editor" | "docs" | "release-notes" | "not-found";

/** 7 画面と、それを開く経路 */
export const SCREENS: readonly (readonly [Screen, string])[] = [
  ["home", BASE],
  ["catalog", `${BASE}catalog`],
  ["category", `${BASE}catalog/sequence`],
  ["editor", `${BASE}editor`],
  ["docs", `${BASE}docs`],
  ["release-notes", `${BASE}release-notes`],
  ["not-found", `${BASE}no-such-page`],
];

export const REPO = "https://github.com/cardene777/dragon";

/** 帯の行き先。並びと名前と行き先 */
export const DESTINATIONS = [
  { ja: "概要", en: "Home", href: BASE },
  { ja: "カタログ", en: "Catalog", href: `${BASE}catalog` },
  { ja: "編集画面", en: "Editor", href: `${BASE}editor` },
  { ja: "使い方", en: "Docs", href: `${BASE}docs` },
  { ja: "更新履歴", en: "Release notes", href: `${BASE}release-notes` },
  { ja: "GitHub", en: "GitHub", href: REPO },
] as const;

/** 帯の色味の切替に並ぶ色味。図の色味の表の順 */
export const PALETTE_IDS = Object.keys(PALETTES);

export type Scheme = "light" | "dark";

/** 色味と明暗の図の地と字 (`.dg-player` の `--bg` と `--ink`) */
export const figureLook = (id: string, scheme: Scheme): string => {
  const v: Record<string, string> = PALETTES[id]?.[scheme] ?? {};
  return `${(v.bg ?? "").toLowerCase()} ${(v.ink ?? "").toLowerCase()}`;
};

/** 頁の中の図ごとの地と字。`within` の中の図だけを見る */
export const figureLooks = (page: Page, within = "body"): Promise<string[]> =>
  page.evaluate(
    (s) =>
      [...document.querySelectorAll(`${s} .dg-player`)].map((p) => {
        const v = (name: string): string => getComputedStyle(p).getPropertyValue(name).trim().toLowerCase();
        return `${v("--bg")} ${v("--ink")}`;
      }),
    within,
  );

/** 見本の題と図の種類と箱の名前 */
export const sampleOf = (text: string): { title: string; kind: Kind; names: string[] } | undefined => {
  const parsed = parseNotation(text);
  if (!parsed.ok) return undefined;
  const { title, kind, blocks } = parsed.diagram;
  return { title, kind, names: [...new Set((blocks.box ?? []).map((b) => b.name))].sort() };
};

/** カタログの部品 (#3033) */
export const catalogSel = (name: string): string => `[data-catalog="${name}"]`;

export type Kind = Diagram["kind"];

/** カタログの分類の並び。図の種類の名前の表 (`TEXT.ja.shelf.kinds`) の順 */
export const KINDS = Object.keys(TEXT.ja.shelf.kinds) as Kind[];

/** 分類に載る見本。見本の記法を読み、図の種類で束ねる */
export const samplesOf = (kind: Kind): ExampleKey[] => EXAMPLE_KEYS.filter((key) => sampleOf(exampleText(key, "ja"))?.kind === kind);

/** 分類の頁の一覧と、右に出ている見本 */
export interface Category {
  count: string;
  items: { title: string; current: boolean }[];
  empty: boolean;
  /** 一覧の幅と、一覧の右端から見本の左端までの間 (四捨五入)。一覧か見本が無い時は null */
  side: { width: number; gap: number } | null;
  title: string;
  about: string;
  names: string[];
  phase: string;
  segs: number;
  done: number;
  note: string;
  editor: string;
}

export const categoryOf = (page: Page): Promise<Category> =>
  page.evaluate(() => {
    const q = (name: string): Element | null => document.querySelector(`[data-catalog="${name}"]`);
    const text = (name: string): string => q(name)?.textContent?.trim() ?? "";
    const svg = document.querySelector('[data-catalog="stage"] svg[data-dragon="figure"]');
    const side = q("sidebar")?.getBoundingClientRect();
    const preview = q("preview")?.getBoundingClientRect();
    const editor = q("open-editor");
    const segs = [...document.querySelectorAll<HTMLElement>('[data-catalog="progress-seg"]')];
    return {
      count: text("count"),
      items: [...document.querySelectorAll<HTMLElement>('[data-catalog="item"]')].map((i) => ({
        title: i.textContent?.trim() ?? "",
        current: i.getAttribute("aria-current") === "true",
      })),
      empty: q("empty") !== null,
      side: side && preview ? { width: Math.round(side.width), gap: Math.round(preview.left - side.right) } : null,
      title: document.querySelector('[data-catalog="preview"] h2')?.textContent?.trim() ?? "",
      about: text("about"),
      names: svg ? [...new Set([...svg.querySelectorAll(".dg-sn")].map((n) => n.textContent ?? ""))].sort() : [],
      phase: text("phase-badge"),
      segs: segs.length,
      done: segs.filter((s) => s.dataset.done === "true").length,
      note: text("step-note"),
      editor: editor instanceof HTMLAnchorElement ? `${new URL(editor.href).pathname}${new URL(editor.href).hash}` : "",
    };
  });

export async function onScreen(page: Page, screen: Screen, message: string): Promise<void> {
  await expect.poll(() => screenOf(page), { ...WAIT, message }).toBe(screen);
}

/** 帯の行き先の名前と行き先と現在地の印。帯が無ければ空 */
export const navOf = (page: Page, where = "nav"): Promise<{ text: string; href: string; current: boolean; visible: boolean }[]> =>
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

/**
 * 寄って追う時系列図の窓の上の頭の列に、図の外の部品が重なる点 (#3124)。
 * 頭の列の地のうち窓の切り抜きの中に見える所へ横 13 × 縦 3 の点を並べ、その点で一番上に在る要素が図の外の物なら挙げる。
 * 段の札のように `pointer-events: none` を持つ部品は点で引くと飛ばされるので、測る間だけ全部の部品を引ける形にする。
 * 画面の外の点は数えない。頭の列が無い時は `null`。2 回続けて同じ値を読めた時だけ返す
 */
export const stripCoveredOf = (page: Page, scope: string): Promise<{ step: string; points: number; covered: string[] } | null> =>
  page.evaluate(async (sel) => {
    const read = () => {
      const svg = document.querySelector<SVGSVGElement>(`${sel} svg[data-dragon="figure"]`);
      const strip = svg?.querySelector("g.dg-hd > rect.dg-hd-bg");
      const clip = svg?.querySelector('clipPath[id^="dg-vp-"] rect');
      const ctm = svg?.getScreenCTM();
      if (!svg || !strip || !clip || !ctm) return null;
      const a = new DOMPoint(0, 0).matrixTransform(ctm);
      const z = new DOMPoint(Number(clip.getAttribute("width")), Number(clip.getAttribute("height"))).matrixTransform(ctm);
      const s = strip.getBoundingClientRect();
      const left = Math.max(s.left, a.x);
      const right = Math.min(s.right, z.x);
      const top = Math.max(s.top, a.y);
      const bottom = Math.min(s.bottom, z.y);
      const covered: string[] = [];
      let points = 0;
      const reach = document.createElement("style");
      reach.textContent = "*, *::before, *::after { pointer-events: auto !important; }";
      document.head.appendChild(reach);
      for (let i = 0; i <= 12; i++) {
        for (const f of [0.12, 0.5, 0.88]) {
          const x = left + 2 + ((right - left - 4) * i) / 12;
          const y = top + (bottom - top) * f;
          if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
          points += 1;
          const hit = document.elementFromPoint(x, y);
          if (hit && !svg.contains(hit)) covered.push(`${hit.tagName.toLowerCase()}.${String(hit.className).split(" ")[0]} (${Math.round(x)}, ${Math.round(y)})`);
        }
      }
      reach.remove();
      return { step: document.querySelector(`${sel} [data-dragon="step-no"]`)?.textContent ?? "", points, covered };
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  }, scope);

/** 帯の並べ方を確かめる見本。時系列図の oauth と、本文の最も長い段が長い構成図の ccip */
export const CAPTION_SAMPLES = [
  { key: "oauth", category: "sequence" },
  { key: "ccip", category: "architecture" },
] as const satisfies readonly { key: ExampleKey; category: Kind }[];

/** 分類の頁で見本 `key` を選ぶ。`still` の時は動きを嫌う設定で開き、段を釦で送れるようにする。`touch` の時は指で触る端末を模す (#3076) */
export const openItem = async (viewport: { width: number; height: number }, sample: (typeof CAPTION_SAMPLES)[number], still = false, touch = false): Promise<Page> => {
  const { page } = await site.open({ path: `${BASE}catalog/${sample.category}`, viewport, touch, reducedMotion: still ? "reduce" : "no-preference" });
  await onScreen(page, "category", `${viewport.width} × ${viewport.height} で ${sample.category} の分類の頁が出ない`);
  await page.locator(catalogSel("item")).nth(samplesOf(sample.category).indexOf(sample.key)).click();
  return page;
};

/** 分類の頁で見本 `key` を重ね窓で開く。`still` の時は動きを嫌う設定で開き、段を釦で送れるようにする。`touch` の時は指で触る端末を模す (#3076) */
export const openOverlay = async (viewport: { width: number; height: number }, sample: (typeof CAPTION_SAMPLES)[number], still = false, touch = false): Promise<Page> => {
  const page = await openItem(viewport, sample, still, touch);
  await page.locator(catalogSel("expand")).click();
  return page;
};

/** 見本 `key` を編集画面で開く。`still` の時は動きを嫌う設定で開き、段を釦で送れるようにする。`touch` の時は指で触る端末を模す (#3076) */
export const openEditor = async (viewport: { width: number; height: number }, key: ExampleKey, still = false, touch = false): Promise<Page> => {
  const { page } = await site.open({ path: `${BASE}editor${toHash(exampleText(key, "ja"))}`, viewport, touch, reducedMotion: still ? "reduce" : "no-preference" });
  return page;
};

export interface CaptionBox {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * 置き場 `scope` の段の本文の帯の高さ、図の枠の中の高さ、帯の左右の余白を除いた中身の左端と右端、釦と段の番号と今の段の題と本文の箱、
 * 全部の段の写しの題と本文が帯の中身の幅に収まるか (#3057)。2 回続けて同じ値を読めた時だけ返す
 */
export const captionOf = (
  page: Page,
  scope: string,
): Promise<{ bar: number; frame: number; inner: { left: number; right: number }; buttons: CaptionBox; no: CaptionBox; title: CaptionBox; body: CaptionBox; inside: boolean } | null> =>
  page.evaluate(async (scope) => {
    await document.fonts.ready;
    const read = () => {
      const bar = document.querySelector(`${scope} .dg-bar`);
      const frameEl = document.querySelector<HTMLElement>(`${scope} .dg-frame`);
      const parts = [".dg-btns", '[data-dragon="step-no"]', '[data-dragon="step-title"]', '[data-dragon="step-body"]'].map((s) => document.querySelector(`${scope} ${s}`));
      if (!bar || !frameEl || parts.some((part) => !part)) return null;
      const box = (el: Element): CaptionBox => {
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) };
      };
      const barBox = bar.getBoundingClientRect();
      const style = getComputedStyle(bar);
      const inner = { left: Math.round(barBox.left + Number.parseFloat(style.paddingLeft)), right: Math.round(barBox.right - Number.parseFloat(style.paddingRight)) };
      const frameStyle = getComputedStyle(frameEl);
      const texts = [...document.querySelectorAll(`${scope} [data-dragon="caption-room"] > *, ${scope} [data-dragon="step-title"], ${scope} [data-dragon="step-body"]`)];
      const [buttons, no, title, body] = parts.map((part) => box(part as Element)) as [CaptionBox, CaptionBox, CaptionBox, CaptionBox];
      return {
        bar: Math.round(barBox.height),
        frame: Math.round(frameEl.clientHeight - Number.parseFloat(frameStyle.paddingTop) - Number.parseFloat(frameStyle.paddingBottom)),
        inner,
        buttons,
        no,
        title,
        body,
        inside: texts.every((text) => {
          const r = text.getBoundingClientRect();
          return r.left >= inner.left - 0.5 && r.right <= inner.right + 0.5 && text.scrollWidth <= text.clientWidth + 1;
        }),
      };
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  }, scope);

export const PHONES = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

/**
 * `read` が読む部品ごとの `名前 幅x高さ` (四捨五入) が `expected` と同じになるまで待つ (#3095)。
 * 44px に届かない部品を拾う絞り込みは、44px にした部品がそれより大きくなっても落ちないため、決めた画面の大きさ 1 つで部品の大きさごと比べる
 */
export const expectSizes = (read: () => Promise<{ name: string; width: number; height: number }[] | null>, where: string, expected: readonly string[]): Promise<void> =>
  expect
    .poll(async () => (await read())?.map((p) => `${p.name} ${Math.round(p.width)}x${Math.round(p.height)}`), { ...WAIT, message: `${where}で、部品の大きさが今と違う` })
    .toEqual(expected);

/** 時系列図の分類の頁を開く。最初の見本 (入門の例) を選んでいて、図は枠に合わせて描く (#3067)。`touch` の時は指で触る端末を模す (#3076) */
export const openSequence = async (viewport: { width: number; height: number }, touch = false): Promise<Page> => {
  const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport, touch, reducedMotion: "reduce" });
  await onScreen(page, "category", `${viewport.width} × ${viewport.height} で時系列図の分類の頁が出ない`);
  await page.waitForSelector(`${catalogSel("stage")} svg[data-dragon="figure"]`);
  return page;
};
