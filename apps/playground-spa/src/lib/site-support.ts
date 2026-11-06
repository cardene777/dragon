/**
 * サイトの検査の file のうち 2 つ以上が使う道具 (#3381)。
 *
 * サイトの検査は 1 つの file に 111 件を順に並べており、1 つの作業者が順に回すので一式の上限 (5 分) を超えた。
 * 話題ごとの file に分けて別の作業者が同時に回す。1 つの file だけが使う道具はその file に置く。
 * 頁の配り手と、準備の段が起こした Chromium で頁を開く口 (`site`) は、検査の file が `useSite()` で用意する。読む側は import した名前のまま使える
 */

import { type Diagram, PALETTES, parseNotation } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { EXAMPLE_KEYS, type ExampleKey } from "../examples";
import { toHash } from "../share";
import { type Lang, TEXT } from "../text";
import { BASE, example, screenOf, type Site, startSite } from "./playground-support";
import { afterAll, afterEach, beforeAll, expect } from "vitest";

/** 頁を組ごとに使い回す道具 (#3419) */
export interface PageGroups<T> {
  /** 組 `key` の頁。無ければ `open` で開く。今の件が落ちたら (`onFailed` に渡した処理が呼ばれたら) 閉じ、同じ組の次の件に開き直させる */
  get(key: string, open: () => Promise<T>, onFailed: (run: () => void) => void): Promise<T>;
  /** 開いた回数 */
  opened(): number;
  /** 頁を求められた組の数 */
  groups(): number;
  /** 開いている頁を閉じる */
  close(): Promise<void>;
}

/**
 * 頁を組ごとに使い回す (#3419)。組の最初の件が頁を開き、同じ組の続く件は同じ頁を使う。
 * 頁を開くたびに読み込み (script と字) を待つ手間を、組の数に減らす。
 * 組が替わると前の組の頁を閉じるので、同時に開いている頁は 1 つだけ。前の組の件が残した頁の状態は次の組へ渡らない。
 * 件が落ちるとその頁を閉じ、同じ組の次の件に開き直させる。落ちた件は重ね窓を開いたままや段を送った途中で止まるので、
 * そのまま使うと次の件も巻き込まれて落ちる
 */
export function pageGroups<T>(close: (item: T) => Promise<void>): PageGroups<T> {
  let current: { key: string; item: Promise<T> } | undefined;
  let closing: Promise<void> = Promise.resolve();
  const keys = new Set<string>();
  let opened = 0;
  const drop = (): void => {
    const was = current;
    current = undefined;
    if (was) closing = closing.then(() => was.item.then(close, () => undefined));
  };
  return {
    async get(key, open, onFailed) {
      keys.add(key);
      if (current?.key !== key) drop();
      await closing;
      if (current === undefined) {
        opened += 1;
        current = { key, item: open() };
      }
      const mine = current;
      onFailed(() => {
        if (current === mine) drop();
      });
      return mine.item;
    },
    opened: () => opened,
    groups: () => keys.size,
    close: async () => {
      drop();
      await closing;
    },
  };
}

/** 検査の file が開く頁の配り手と、頁を開く口。`useSite()` が file の最初に起こし、最後に配り手を閉じる。Chromium は file の process が終わる時に止まる (#3388) */
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

/** 件をまたいで使い回す分類の頁を、動きを嫌う設定で開く (#3419)。閉じるのは使い回す道具 (`pageGroups`) */
export const openKeptCategory = async (viewport: { width: number; height: number }, category: Kind): Promise<Page> => {
  const { page } = await site.open({ path: `${BASE}catalog/${category}`, viewport, reducedMotion: "reduce", keep: true });
  await onScreen(page, "category", `${viewport.width} × ${viewport.height} で ${category} の分類の頁が出ない`);
  return page;
};

/** 件をまたいで使い回す編集画面を、動きを嫌う設定で開く (#3419)。見本は `showInEditor` で棚から読む。閉じるのは使い回す道具 (`pageGroups`) */
export const openKeptEditor = async (viewport: { width: number; height: number }): Promise<Page> => {
  const { page } = await site.open({ path: `${BASE}editor`, viewport, reducedMotion: "reduce", keep: true });
  await onScreen(page, "editor", `${viewport.width} × ${viewport.height} で編集画面が出ない`);
  return page;
};

/**
 * 使い回す分類の頁で、見本 `sample` を重ね窓で開く (#3419)。頁が別の分類を出している時は、カタログの一覧を通って見本の分類の頁へ移る。
 * 頁を読み直さずに移るので、頁の読み込みを待たない。前の件は重ね窓を閉じて終わる
 */
export const showInOverlay = async (page: Page, sample: { key: ExampleKey; category: Kind }): Promise<void> => {
  if (!new URL(page.url()).pathname.endsWith(`/catalog/${sample.category}`)) {
    await page.locator(`${catalogSel("crumb")} a[href$="/catalog"]`).click();
    await page.locator(`${catalogSel("card")}[href$="/catalog/${sample.category}"]`).click();
    await onScreen(page, "category", `カタログの一覧から ${sample.category} の分類の頁へ移れない`);
  }
  await page.locator(catalogSel("item")).nth(samplesOf(sample.category).indexOf(sample.key)).click();
  await page.locator(catalogSel("expand")).click();
};

/**
 * 使い回す編集画面に、見本 `key` を棚から読んで 1 段目から出す (#3419)。
 * 今の見本が `key` の時は読み直さず、前の件が送った段を 1 段目へ戻す
 */
export const showInEditor = async (page: Page, key: ExampleKey): Promise<void> => {
  const sample = page.locator(`[data-playground="sample-${key}"]`);
  if ((await sample.getAttribute("aria-current")) !== "true") {
    await page.locator('[data-playground="shelf-toggle"]').click();
    await sample.click();
    await expect.poll(() => sample.getAttribute("aria-current"), { ...WAIT, message: `編集画面の棚から ${key} を読めない` }).toBe("true");
  }
  await page.locator('[data-playground="stage"] [data-dragon="restart"]').click();
  await expect
    .poll(() => page.locator('[data-playground="stage"] [data-dragon="step-no"]').textContent(), { ...WAIT, message: `編集画面の ${key} が 1 段目に戻らない` })
    .toMatch(/^01\//u);
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
): Promise<{ bar: number; frame: number; inner: { left: number; right: number }; buttons: CaptionBox; no: CaptionBox; title: CaptionBox; body: CaptionBox; segments: CaptionBox; inside: boolean } | null> =>
  page.evaluate(async (scope) => {
    await document.fonts.ready;
    const read = () => {
      const bar = document.querySelector(`${scope} .dg-bar`);
      const frameEl = document.querySelector<HTMLElement>(`${scope} .dg-frame`);
      const parts = [".dg-btns", '[data-dragon="step-no"]', '[data-dragon="step-title"]', '[data-dragon="step-body"]', '[data-dragon="progress"]'].map((s) => document.querySelector(`${scope} ${s}`));
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
      const [buttons, no, title, body, segments] = parts.map((part) => box(part as Element)) as [CaptionBox, CaptionBox, CaptionBox, CaptionBox, CaptionBox];
      return {
        bar: Math.round(barBox.height),
        frame: Math.round(frameEl.clientHeight - Number.parseFloat(frameStyle.paddingTop) - Number.parseFloat(frameStyle.paddingBottom)),
        inner,
        buttons,
        no,
        title,
        body,
        segments,
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

/**
 * 広い帯 (中身の幅が 640px 以上) の並べ方 (#3398)。番号と題と本文を左に、釦を題の行の右端に、段ごとの進み具合を帯の全幅で一番下に置く。
 * `gaps` は番号と題の間、題の欄と釦の間、題と釦の上端の差、題と本文の間
 */
export const wideCaptionShape = (seen: NonNullable<Awaited<ReturnType<typeof captionOf>>>) => {
  const { inner, buttons, no, title, body, segments } = seen;
  return {
    buttonsBesideTitle: buttons.left >= title.right && buttons.top < title.bottom,
    buttonsAtRight: Math.abs(buttons.right - inner.right) <= 1,
    noBesideTitle: no.right <= title.left && Math.abs(no.left - inner.left) <= 1,
    bodyUnderTitle: body.top >= title.bottom && Math.abs(body.left - title.left) <= 1,
    segmentsUnder: segments.top >= Math.max(body.bottom, buttons.bottom),
    segmentsFull: Math.abs(segments.left - inner.left) <= 1 && Math.abs(segments.right - inner.right) <= 1,
    gaps: { title: title.left - no.right, buttons: buttons.left - title.right, top: buttons.top - title.top, body: body.top - title.bottom },
  };
};

/**
 * 積む帯 (中身の幅が 640px より狭い帯、#3398) の並べ方。上の操作の段に釦を左から、段ごとの進み具合を釦の右から帯の右端まで置き、
 * その下の番号の右に題、その下に説明文を帯の全幅で置く。`gaps` は番号と題の間と、釦と進み具合の間
 */
export const stackedCaptionShape = (seen: NonNullable<Awaited<ReturnType<typeof captionOf>>>) => {
  const { inner, buttons, no, title, body, segments } = seen;
  return {
    noBesideTitle: no.right <= title.left && Math.abs(no.left - inner.left) <= 1 && no.top < title.bottom,
    bodyUnderTitle: body.top >= title.bottom,
    bodyFull: Math.abs(body.left - inner.left) <= 1 && Math.abs(body.right - inner.right) <= 1,
    buttonsAboveTitle: buttons.bottom <= title.top && Math.abs(buttons.left - inner.left) <= 1,
    segmentsBesideButtons: segments.top < buttons.bottom && segments.bottom > buttons.top && Math.abs(segments.right - inner.right) <= 1,
    gaps: { title: title.left - no.right, buttons: segments.left - buttons.right },
  };
};

/** 積む帯の並べ方の期待。番号と題の間は 16px、釦と進み具合の間は 10px */
export const STACKED_CAPTION = {
  noBesideTitle: true,
  bodyUnderTitle: true,
  bodyFull: true,
  buttonsAboveTitle: true,
  segmentsBesideButtons: true,
  gaps: { title: 16, buttons: 10 },
} as const;

/** 広い帯の並べ方の期待。番号と題の間と題の欄と釦の間は 16px、釦は題の上端にそろえ、本文は題のすぐ下に置く */
export const WIDE_CAPTION = {
  buttonsBesideTitle: true,
  buttonsAtRight: true,
  noBesideTitle: true,
  bodyUnderTitle: true,
  segmentsUnder: true,
  segmentsFull: true,
  gaps: { title: 16, buttons: 16, top: 0, body: 0 },
} as const;

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
