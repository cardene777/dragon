/**
 * サイトの上の帯と 7 画面の経路 (#3030)、概要 (#3032)、カタログと色味 (#3033)。
 *
 * 0.35.0 より前のサイトと同じ経路で 7 画面を出し分け、どの画面にも同じ上の帯を載せる。
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 画面は `data-site-screen` の札で見分け、帯の部品は `data-site`、カタログの部品は `data-catalog` の札で探す。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_PALETTE, type Diagram, PALETTES, parseNotation, readDiagram } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { EXAMPLE_KEYS, type ExampleKey, exampleText, TEMPLATE } from "../examples";
import { toHash } from "../share";
import { type Lang, TEXT } from "../text";
import { app, BASE, captionClearance, expectSteadyAcrossSteps, rgb, root, type Site, settledStepShape, startSite } from "./playground-support";

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

/** 色味ごとにサイトの差し色にする字の色の欄 (#3033)。紙と墨は朱、澄んだ色と夜の計器は青 */
const ACCENT: Record<string, string> = { paper: "t-rose", clear: "t-blue", night: "t-blue" };

/** 帯の色味の切替に並ぶ色味。図の色味の表の順 */
const PALETTE_IDS = Object.keys(PALETTES);

type Scheme = "light" | "dark";

/** 色味と明暗のサイトの地、帯の面、字、釦の差し色。図の色味の表 (`PALETTES`) から引く */
const siteLook = (id: string, scheme: Scheme): { bg: string; surface: string; text: string; accent: string } => {
  const v: Record<string, string> = PALETTES[id]?.[scheme] ?? {};
  return { bg: v.page ?? "", surface: v.surf ?? "", text: v.ink ?? "", accent: v[ACCENT[id] ?? ""] ?? "" };
};

/** 色味と明暗の図の地と字 (`.dg-player` の `--bg` と `--ink`) */
const figureLook = (id: string, scheme: Scheme): string => {
  const v: Record<string, string> = PALETTES[id]?.[scheme] ?? {};
  return `${(v.bg ?? "").toLowerCase()} ${(v.ink ?? "").toLowerCase()}`;
};

/** 頁の中の図ごとの地と字。`within` の中の図だけを見る */
const figureLooks = (page: Page, within = "body"): Promise<string[]> =>
  page.evaluate(
    (s) =>
      [...document.querySelectorAll(`${s} .dg-player`)].map((p) => {
        const v = (name: string): string => getComputedStyle(p).getPropertyValue(name).trim().toLowerCase();
        return `${v("--bg")} ${v("--ink")}`;
      }),
    within,
  );

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

/** カタログの部品 (#3033) */
const catalogSel = (name: string): string => `[data-catalog="${name}"]`;

type Kind = "sequence" | "architecture";

/** カタログの分類の並び。図の種類の名前の表 (`TEXT.ja.shelf.kinds`) の順 */
const KINDS = Object.keys(TEXT.ja.shelf.kinds) as Kind[];

/** 分類に載る見本。見本の記法を読み、図の種類で束ねる */
const samplesOf = (kind: Kind): ExampleKey[] => EXAMPLE_KEYS.filter((key) => sampleOf(exampleText(key, "ja"))?.kind === kind);

/** 見本の原本の JSON。編集画面の JSON の側と同じく、読んで検査した図を 2 字下げで書く */
const jsonOf = (text: string): string => {
  const parsed = parseNotation(text);
  const read = parsed.ok ? readDiagram(parsed.diagram) : undefined;
  return read?.ok ? JSON.stringify(read.diagram, null, 2) : "";
};

/** カタログの一覧の札 */
const cardsOf = (page: Page): Promise<{ no: string; count: string; title: string; desc: string; open: string; href: string }[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="card"]')].map((card) => {
      const text = (name: string): string => card.querySelector(`[data-catalog="${name}"]`)?.textContent?.trim() ?? "";
      return {
        no: text("card-no"),
        count: text("card-count"),
        title: card.querySelector("h2")?.textContent?.trim() ?? "",
        desc: text("card-desc"),
        open: text("card-open"),
        href: card.href ? new URL(card.href).pathname : "",
      };
    }),
  );

/** 分類の頁の一覧と、右に出ている見本 */
interface Category {
  count: string;
  items: { title: string; current: boolean }[];
  empty: boolean;
  /** 一覧が見本の左に並ぶ */
  sideBySide: boolean;
  title: string;
  about: string;
  names: string[];
  phase: string;
  segs: number;
  done: number;
  note: string;
  editor: string;
}

const categoryOf = (page: Page): Promise<Category> =>
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
      sideBySide: side !== undefined && preview !== undefined && side.width > 0 && side.right <= preview.left,
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

/** 右に出る見本の、段に関わらない中身 */
const shownOf = (c: Category): Pick<Category, "title" | "about" | "names" | "segs" | "editor"> => ({
  title: c.title,
  about: c.about,
  names: c.names,
  segs: c.segs,
  editor: c.editor,
});

/** 見本を右に出した時に期待する、段に関わらない中身 */
const expectedShown = (key: ExampleKey, lang: Lang): ReturnType<typeof shownOf> => {
  const text = exampleText(key, lang);
  const s = sampleOf(text);
  const parsed = parseNotation(text);
  const steps = parsed.ok ? parsed.diagram.steps.length : 0;
  return { title: s?.title ?? "", about: aboutOf(text), names: s?.names ?? [], segs: steps > 1 ? steps : 0, editor: `${BASE}editor${toHash(text)}` };
};

/**
 * 段の札と段の本文と進み具合の帯が、同じ段を指しているか。図は自分で段を進めるので、どの段かは決めずに見る。
 * 食い違えば何が食い違ったかを返し、揃っていれば空を返す。
 */
const stepMismatch = (c: Category, key: ExampleKey, lang: Lang): string => {
  const parsed = parseNotation(exampleText(key, lang));
  const steps = parsed.ok ? parsed.diagram.steps : [];
  if (steps.length < 2) return c.phase === "" ? "" : `段が 1 つの見本に段の札「${c.phase}」が出た`;
  const at = steps.findIndex((s, i) => TEXT[lang].stage.phase(i + 1, steps.length, s.title) === c.phase);
  if (at < 0) return `段の札「${c.phase}」がどの段の札でもない`;
  if (c.note !== (steps[at]?.body ?? "").trim()) return `段 ${at + 1} の本文が出ない (出た本文「${c.note}」)`;
  if (c.done !== at + 1) return `段 ${at + 1} なのに進み具合の帯が ${c.done} 区切り進んでいる`;
  return "";
};

/** 使い方の部品 (#3034) */
const docsSel = (name: string): string => `[data-docs="${name}"]`;

/** 使い方の節の並び。節の番号はこの並びから付く */
const DOC_SECTIONS = ["start", "boxes", "edges", "regions", "steps", "strip", "carry", "json", "export"] as const;

/** 節の例の file。JSON の節は原本の JSON。無ければ `undefined` */
const docsExample = (id: string, lang: Lang): string | undefined => {
  const name = `${id}${lang === "en" ? ".en" : ""}.${id === "json" ? "json" : "dragon"}`;
  const path = join(app, "src/docs/examples", name);
  return existsSync(path) ? readFileSync(path, "utf8").trimEnd() : undefined;
};

/** 節の例を読んで検査を通した図。JSON の節は原本の JSON として読む */
const docsDiagram = (id: string, text: string): Diagram | undefined => {
  let input: unknown;
  if (id === "json") {
    try {
      input = JSON.parse(text);
    } catch {
      return undefined;
    }
  } else {
    const parsed = parseNotation(text);
    if (!parsed.ok) return undefined;
    input = parsed.diagram;
  }
  const read = readDiagram(input);
  return read.ok ? read.diagram : undefined;
};

const eventsOf = (d: Diagram): Diagram["steps"][number]["events"] => d.steps.flatMap((s) => s.events);

/** 節の例が、その節で説明する記法の要素を使っているか */
const DOC_COVERS: Record<string, (d: Diagram) => boolean> = {
  start: (d) => d.boxes.length >= 2 && d.steps.length >= 1,
  boxes: (d) => d.boxes.length >= 3 && d.boxes.every((b) => b.color !== undefined) && d.boxes.some((b) => b.icon !== undefined && b.sub !== undefined),
  edges: (d) => eventsOf(d).filter((e) => e.type === "edge" && e.label !== undefined).length >= 2 && eventsOf(d).some((e) => e.type === "action"),
  regions: (d) => d.kind === "architecture" && (d.regions?.length ?? 0) >= 2 && d.boxes.some((b) => b.region !== undefined),
  steps: (d) => d.steps.length >= 2 && d.steps.some((s) => s.code !== undefined) && eventsOf(d).some((e) => e.type === "swap"),
  strip: (d) => d.strip !== undefined && eventsOf(d).some((e) => e.type === "strip"),
  carry: (d) => ["envelope", "tag", "coin", "none"].every((kind) => eventsOf(d).some((e) => e.type === "edge" && e.carry.kind === kind)),
  json: (d) => d.version >= 1 && d.steps.length >= 1,
};

/** package の README の `sh` の囲みの行。書き出しの節の命令はこれと同じ物を出す */
const readmeCommands = (): string[] => {
  const readme = readFileSync(join(root, "packages/dragon/README.md"), "utf8");
  return [...readme.matchAll(/```sh\n([\s\S]*?)```/gu)].flatMap((m) => (m[1] ?? "").split("\n").filter((line) => line.trim() !== ""));
};

/** 書き出しの命令の使い方の表示に並ぶ設定の名前 (`--out` など) */
const cliOptions = (): string[] => {
  const cli = readFileSync(join(root, "packages/dragon/src/cli.ts"), "utf8");
  const usage = cli.slice(cli.indexOf("usage: ["), cli.indexOf("].join"));
  return [...usage.matchAll(/["`] {2}(--[a-z][a-z-]*) /gu)].map((m) => m[1] ?? "");
};

/** 使い方の頁の前置きと札と節 */
const docsOf = (
  page: Page,
): Promise<{
  title: string;
  lead: string;
  ctas: string[];
  cards: { href: string; name: string; text: string }[];
  sections: { id: string; no: string; title: string; texts: number; code: string | null; names: string[]; commands: string[]; cta: string | null; body: string }[];
}> =>
  page.evaluate(() => {
    const where = (a: HTMLAnchorElement): string => {
      const url = new URL(a.href);
      return url.origin === location.origin ? `${url.pathname}${url.hash}` : a.href;
    };
    const hero = document.querySelector('[data-docs="hero"]');
    return {
      title: hero?.querySelector("h1")?.textContent?.trim() ?? "",
      lead: hero?.querySelector('[data-docs="lead"]')?.textContent?.trim() ?? "",
      ctas: [...document.querySelectorAll<HTMLAnchorElement>('[data-docs="cta"] a')].map(where),
      cards: [...document.querySelectorAll<HTMLAnchorElement>('a[data-docs="card"]')].map((a) => ({
        href: new URL(a.href).hash,
        name: a.querySelector('[data-docs="card-name"]')?.textContent?.trim() ?? "",
        text: a.querySelector("p")?.textContent?.trim() ?? "",
      })),
      sections: [...document.querySelectorAll<HTMLElement>('section[data-docs="section"]')].map((s) => {
        const example = s.querySelector('[data-docs="example"]');
        const svg = example?.querySelector('svg[data-dragon="figure"]');
        const cta = s.querySelector<HTMLAnchorElement>('a[data-docs="section-cta"]');
        return {
          id: s.id,
          no: s.querySelector('[data-docs="section-no"]')?.textContent?.trim() ?? "",
          title: s.querySelector("h2")?.textContent?.trim() ?? "",
          texts: [...s.querySelectorAll('[data-docs="text"]')].filter((p) => (p.textContent ?? "").trim() !== "").length,
          code: example?.querySelector('[data-docs="example-code"]')?.textContent ?? null,
          names: svg ? [...new Set([...svg.querySelectorAll(".dg-sn")].map((n) => n.textContent ?? ""))].sort() : [],
          commands: [...s.querySelectorAll('[data-docs="command"]')].map((c) => c.textContent ?? ""),
          cta: cta ? where(cta) : null,
          body: s.textContent ?? "",
        };
      }),
    };
  });

/** 版の札に出す版 (#3035)。`packages/dragon/package.json` の版の `v{major}.{minor}` */
const VERSION = ((): string => {
  const { version } = JSON.parse(readFileSync(join(root, "packages/dragon/package.json"), "utf8")) as { version: string };
  return `v${version.split(".").slice(0, 2).join(".")}`;
})();

/** 札の字を空白で区切った語。版は語として比べ、`v0.35.1` のような版の写し違いを `v0.35` に一致させない */
const wordsOf = (text: string): string[] => text.split(/\s+/u);

/** 更新履歴の頁の部品 (#3035) */
const releaseOf = (
  page: Page,
): Promise<{ crumb: string[]; eyebrow: string; title: string; lead: string; links: { text: string; href: string; target: string | null; rel: string }[] }> =>
  page.evaluate(() => {
    const at = (name: string): Element | null => document.querySelector(`[data-release="${name}"]`);
    return {
      crumb: [...(at("crumb")?.querySelectorAll("a") ?? [])].map((a) => new URL(a.href).pathname),
      eyebrow: at("eyebrow")?.textContent?.trim() ?? "",
      title: at("hero")?.querySelector("h1")?.textContent?.trim() ?? "",
      lead: at("lead")?.textContent?.trim() ?? "",
      links: [...document.querySelectorAll<HTMLAnchorElement>('[data-release="actions"] a')].map((a) => ({
        text: (a.textContent ?? "").replace("↗", "").trim(),
        href: a.href,
        target: a.getAttribute("target"),
        rel: a.getAttribute("rel") ?? "",
      })),
    };
  });

/** 見つからない頁の部品 (#3035) */
const notFoundOf = (page: Page): Promise<{ code: string; title: string; lead: string; links: string[]; path: string }> =>
  page.evaluate(() => {
    const at = (name: string): Element | null => document.querySelector(`[data-not-found="${name}"]`);
    return {
      code: (at("code")?.textContent ?? "").replace(/\s/gu, ""),
      title: document.querySelector('[data-site-screen="not-found"] h1')?.textContent?.trim() ?? "",
      lead: at("lead")?.textContent?.trim() ?? "",
      links: [...document.querySelectorAll<HTMLAnchorElement>('[data-not-found="cta"] a')].map((a) => new URL(a.href).pathname),
      path: at("path")?.textContent?.trim() ?? "",
    };
  });

/** 右の見本の道具のうち、頁に無い物 */
const PREVIEW_TOOLS = ["tab-figure", "tab-code", "palette", "zoom-out", "zoom-in", "fit", "zoom-level", "expand", "stage", "phase-badge", "progress", "step-note", "open-editor"] as const;
const missingTools = (page: Page): Promise<string[]> =>
  page.evaluate((names) => names.filter((n) => document.querySelector(`[data-catalog="preview"] [data-catalog="${n}"]`) === null), [...PREVIEW_TOOLS] as string[]);

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
    "site-colors-follow-palette",
    async () => {
      const light = await site.open({ path: BASE, colorScheme: "light" });
      await onScreen(light.page, "home", "概要の頁が出ない");
      await expect
        .poll(() => colorsOf(light.page), { ...WAIT, message: "色味を選ぶ前の明るい側の頁の色が紙と墨の値でない" })
        .toEqual(rgbOf(siteLook(DEFAULT_PALETTE, "light")));

      // 端末が暗い設定なら暗い側で開く
      const dark = await site.open({ path: BASE, colorScheme: "dark" });
      await onScreen(dark.page, "home", "概要の頁が出ない");
      await expect
        .poll(() => colorsOf(dark.page), { ...WAIT, message: "色味を選ぶ前の暗い側の頁の色が紙と墨の値でない" })
        .toEqual(rgbOf(siteLook(DEFAULT_PALETTE, "dark")));

      // 明暗の切替を押すと替わり、もう 1 度押すと戻る
      await light.page.locator(siteSel("theme")).click();
      await expect.poll(() => colorsOf(light.page), { ...WAIT, message: "明暗の切替で暗い側にならない" }).toEqual(rgbOf(siteLook(DEFAULT_PALETTE, "dark")));
      await light.page.locator(siteSel("theme")).click();
      await expect.poll(() => colorsOf(light.page), { ...WAIT, message: "明暗の切替で明るい側に戻らない" }).toEqual(rgbOf(siteLook(DEFAULT_PALETTE, "light")));
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

  it(
    "catalog-cards-count-from-samples",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "catalog", "カタログの一覧が出ない");

      // 分類ごとの札。番号、件数、見出し、説明、開く。件数は分類に載る見本を数えた数
      const expected = KINDS.map((kind, i) => ({
        no: String(i + 1).padStart(2, "0"),
        count: `${samplesOf(kind).length} 件`,
        title: TEXT.ja.shelf.kinds[kind],
        href: `${BASE}catalog/${kind}`,
        open: "開く →",
      }));
      await expect
        .poll(async () => (await cardsOf(page)).map(({ no, count, title, href, open }) => ({ no, count, title, href, open })), {
          ...WAIT,
          message: "カタログの一覧に分類の札が見本の数どおりに並ばない",
        })
        .toEqual(expected);
      const cards = await cardsOf(page);
      expect(cards.every((c) => c.desc !== ""), "説明の無い分類の札がある").toBe(true);
      expect(new Set(cards.map((c) => c.desc)).size, "分類の札の説明が分類ごとに違わない").toBe(cards.length);

      // 道筋と見出しと説明。説明は分類の数と見本の数を数えて出す
      expect(
        await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="crumb"] a')].map((a) => new URL(a.href).pathname)),
        "一覧の道筋が概要へ戻らない",
      ).toEqual([BASE]);
      expect(await page.locator(`${catalogSel("index")} h1`).textContent(), "一覧の見出しがカタログでない").toBe("カタログ");
      const desc = (await page.locator(catalogSel("desc")).textContent()) ?? "";
      expect(desc, "一覧の説明が分類の数を出さない").toContain(`${KINDS.length}`);
      expect(desc, "一覧の説明が見本の数を出さない").toContain(`${EXAMPLE_KEYS.length}`);

      // 英語に替えると、札の見出しと開くの字が英語になる
      await page.locator(siteSel("lang-en")).click();
      await expect
        .poll(async () => (await cardsOf(page)).map(({ title, open }) => ({ title, open })), { ...WAIT, message: "英語に替えても分類の札が英語にならない" })
        .toEqual(KINDS.map((kind) => ({ title: TEXT.en.shelf.kinds[kind], open: "Open →" })));

      // 札を押すと、その分類の頁へ移る
      await page.locator(catalogSel("card")).first().click();
      await onScreen(page, "category", "分類の札を押しても分類の頁が出ない");
      expect(await page.evaluate(() => location.pathname), "最初の分類の札が最初の分類へ向かない").toBe(`${BASE}catalog/${KINDS[0]}`);
    },
    SLOW,
  );

  it(
    "category-page-lists-samples-and-previews-one",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "category", "時系列図の分類の頁が出ない");
      const keys = samplesOf("sequence");
      const titleOf = (key: ExampleKey, lang: Lang = "ja"): string => sampleOf(exampleText(key, lang))?.title ?? "";

      // 左の一覧に分類の見本が並び、最初の見本を選んでいる
      await expect
        .poll(async () => (await categoryOf(page)).items, { ...WAIT, message: "分類の頁の一覧に見本が並ばない" })
        .toEqual(keys.map((key, i) => ({ title: titleOf(key), current: i === 0 })));
      const first = await categoryOf(page);
      expect(first.count, "分類の頁に見本の件数が出ない").toBe(`全 ${keys.length} 件`);
      expect(first.sideBySide, "一覧が見本の左に並ばない").toBe(true);
      expect(await page.locator(`${catalogSel("category")} h1`).textContent(), "分類の頁の見出しが図の種類の名前でない").toBe(TEXT.ja.shelf.kinds.sequence);
      expect(
        await page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>('[data-catalog="crumb"] a')].map((a) => new URL(a.href).pathname)),
        "分類の頁の道筋が概要とカタログへ戻らない",
      ).toEqual([BASE, `${BASE}catalog`]);

      // 右に選んだ見本 1 つ。名前と説明、動く図、編集画面で開く
      const firstKey = keys[0] as ExampleKey;
      await expect.poll(async () => shownOf(await categoryOf(page)), { ...WAIT, message: "右に最初の見本が出ない" }).toEqual(expectedShown(firstKey, "ja"));
      expect(stepMismatch(await categoryOf(page), firstKey, "ja"), "最初の見本の段の札と本文と帯が揃わない").toBe("");

      // 一覧で別の見本を選ぶと、右がその見本に替わる
      const lastKey = keys.at(-1) as ExampleKey;
      await page.locator(catalogSel("item")).last().click();
      await expect.poll(async () => shownOf(await categoryOf(page)), { ...WAIT, message: "一覧で選んだ見本に右が替わらない" }).toEqual(expectedShown(lastKey, "ja"));
      expect((await categoryOf(page)).items.map((i) => i.current), "選んだ見本に印が移らない").toEqual(keys.map((_, i) => i === keys.length - 1));
      expect(stepMismatch(await categoryOf(page), lastKey, "ja"), "選んだ見本の段の札と本文と帯が揃わない").toBe("");
      // 段を 2 つ以上持つ見本には、図とコードの見出し、色味、縮小と拡大と幅に合わせる、拡大の釦、段の札、帯、段の本文が揃う
      expect(await missingTools(page), "右の見本に道具が欠けている").toEqual([]);

      // 検索で一覧が絞られる。当てはまる見本が無ければ、無いと出す
      await page.locator(catalogSel("search")).fill("OAuth");
      await expect
        .poll(async () => (await categoryOf(page)).items.map((i) => i.title), { ...WAIT, message: "検索で一覧が絞られない" })
        .toEqual(keys.filter((key) => titleOf(key).includes("OAuth")).map((key) => titleOf(key)));
      await page.locator(catalogSel("search")).fill("当てはまらない語");
      await expect
        .poll(async () => {
          const c = await categoryOf(page);
          return { items: c.items.length, empty: c.empty };
        }, { ...WAIT, message: "当てはまる見本が無い時に、無いと出ない" })
        .toEqual({ items: 0, empty: true });

      // 見本が 1 つしかない分類
      const one = samplesOf("architecture");
      const arch = await site.open({ path: `${BASE}catalog/architecture`, viewport: { width: 1440, height: 900 } });
      await onScreen(arch.page, "category", "構成図の分類の頁が出ない");
      await expect
        .poll(async () => (await categoryOf(arch.page)).items, { ...WAIT, message: "構成図の分類の一覧に見本が並ばない" })
        .toEqual(one.map((key) => ({ title: titleOf(key), current: true })));
      expect((await categoryOf(arch.page)).count).toBe(`全 ${one.length} 件`);
      await expect
        .poll(async () => shownOf(await categoryOf(arch.page)), { ...WAIT, message: "構成図の分類で右に見本が出ない" })
        .toEqual(expectedShown(one[0] as ExampleKey, "ja"));

      // 知らない分類は見つからない頁にする
      const unknown = await site.open({ path: `${BASE}catalog/unknown` });
      await onScreen(unknown.page, "not-found", "知らない分類で見つからない頁が出ない");
    },
    SLOW,
  );

  /** 見本の図の枠と、図の見せ方と、寄って追う図の窓の枠と全体図の地が枠の中に収まるか。図が無ければ `null` */
  const stageFigureOf = (page: Page): Promise<{ stage: number; view: string | null; window: boolean | null; overview: boolean | null } | null> =>
    page.evaluate((s) => {
      const stage = document.querySelector(s);
      const frame = stage?.querySelector(".dg-frame")?.getBoundingClientRect();
      const svg = stage?.querySelector('svg[data-dragon="figure"]');
      if (!stage || !frame || !svg) return null;
      const inside = (el: Element | null | undefined): boolean | null => {
        const r = el?.getBoundingClientRect();
        return r ? r.left >= frame.left - 0.5 && r.right <= frame.right + 0.5 && r.top >= frame.top - 0.5 && r.bottom <= frame.bottom + 0.5 : null;
      };
      return {
        // 枠の上の罫 (1px) を除いた高さ。`clamp(360px, 58vh, 620px)` が決める高さと同じ物
        stage: stage.clientHeight,
        view: svg.getAttribute("data-view"),
        window: inside(svg.querySelector(".dg-vp-frame")),
        overview: inside(svg.querySelector(".dg-mm-bg")),
      };
    }, catalogSel("stage"));

  it(
    "catalog-follow-figure-whole-in-frame",
    async () => {
      // 構成図の見本は、この 2 つの幅で寄って追う図になり、横長の全体図を窓の下に出す (#3042、#3044)
      for (const width of [390, 860]) {
        const { page } = await site.open({ path: `${BASE}catalog/architecture`, viewport: { width, height: 900 } });
        await onScreen(page, "category", `${width}px で構成図の分類の頁が出ない`);
        await expect.poll(async () => (await stageFigureOf(page))?.view, { ...WAIT, message: `${width}px で構成図の見本が寄って追う図にならない` }).toBe("follow");
        await expect
          .poll(async () => {
            const seen = await stageFigureOf(page);
            return { window: seen?.window, overview: seen?.overview };
          }, { ...WAIT, message: `${width}px で寄って追う図の窓か全体図が図の枠からはみ出す` })
          .toEqual({ window: true, overview: true });
      }
    },
    SLOW,
  );

  it(
    "catalog-fixed-figure-keeps-frame-height",
    async () => {
      // 全体を止めて見せる図の枠は `clamp(360px, 58vh, 620px)` のまま。高さ 900px なら 522px
      const expected = Math.min(620, Math.max(360, 0.58 * 900));
      for (const width of [390, 860, 1440]) {
        const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width, height: 900 } });
        await onScreen(page, "category", `${width}px で時系列図の分類の頁が出ない`);
        await expect.poll(async () => (await stageFigureOf(page))?.view, { ...WAIT, message: `${width}px で時系列図の見本が全体を止めて見せる図にならない` }).toBe("fixed");
        expect((await stageFigureOf(page))?.stage, `${width}px で止めて見せる図の枠の高さが変わる`).toBeCloseTo(expected, 0);
      }
    },
    SLOW,
  );

  /**
   * 重ね窓の今の段の番号、図の枠を縦に送る必要があるか、図と寄って追う図の窓の枠と全体図の地が枠の中に収まるか。
   * 重ね窓が無ければ `null`。段の説明の行の数で図の枠の高さが替わり、図は後から合わせ直すので、
   * 2 こま続けて枠と図の寸法が同じ時だけ返す。合わせ直している間も `null` (#3047)
   */
  const overlayFigureOf = (
    page: Page,
  ): Promise<{ step: string; view: string | null; scrolls: boolean; figure: boolean; window: boolean | null; overview: boolean | null } | null> =>
    page.evaluate(async () => {
      await document.fonts.ready;
      const read = () => {
        const overlay = document.querySelector('[data-catalog="overlay"]');
        const frameEl = overlay?.querySelector(".dg-frame");
        const svg = frameEl?.querySelector('svg[data-dragon="figure"]');
        if (!overlay || !frameEl || !svg) return null;
        const frame = frameEl.getBoundingClientRect();
        const box = svg.getBoundingClientRect();
        const inside = (el: Element | null | undefined): boolean | null => {
          const r = el?.getBoundingClientRect();
          return r ? r.left >= frame.left - 0.5 && r.right <= frame.right + 0.5 && r.top >= frame.top - 0.5 && r.bottom <= frame.bottom + 0.5 : null;
        };
        return {
          size: [frameEl.clientHeight, frameEl.scrollHeight, box.width, box.height].map(Math.round).join(","),
          seen: {
            step: overlay.querySelector('[data-dragon="step-no"]')?.textContent ?? "",
            view: svg.getAttribute("data-view"),
            scrolls: frameEl.scrollHeight > frameEl.clientHeight + 1,
            figure: inside(svg) === true,
            window: inside(svg.querySelector(".dg-vp-frame")),
            overview: inside(svg.querySelector(".dg-mm-bg")),
          },
        };
      };
      const frame = () => new Promise((done) => requestAnimationFrame(done));
      const first = read();
      await frame();
      await frame();
      const second = read();
      return first && second && first.size === second.size && first.seen.step === second.seen.step ? second.seen : null;
    });

  it(
    "catalog-overlay-figure-whole-without-scroll",
    async () => {
      // 寄って追う図になる幅 (390、860)、止めて見せる図になる幅 (1024、1440)、低い画面 (1280 × 720)
      const sizes = [
        { width: 390, height: 844 },
        { width: 860, height: 900 },
        { width: 1024, height: 768 },
        { width: 1440, height: 900 },
        { width: 1280, height: 720 },
      ];
      for (const category of ["architecture", "sequence"] as const) {
        const count = samplesOf(category).length;
        for (const viewport of sizes) {
          const { page } = await site.open({ path: `${BASE}catalog/${category}`, viewport });
          // 段の説明の行の数で図の枠の高さが替わるので、自動で送らずに 1 段ずつ確かめる
          await page.emulateMedia({ reducedMotion: "reduce" });
          await onScreen(page, "category", `${viewport.width} × ${viewport.height} で ${category} の分類の頁が出ない`);
          for (let i = 0; i < count; i++) {
            await page.locator(catalogSel("item")).nth(i).click();
            await page.locator(catalogSel("expand")).click();
            const stepItems = page.locator('[data-catalog="overlay"] [data-dragon="steps"] > li');
            await expect.poll(() => stepItems.count(), { ...WAIT, message: `${category} の ${i + 1} 番目の見本の段が読めない` }).toBeGreaterThan(0);
            const steps = await stepItems.count();
            for (let s = 0; s < steps; s++) {
              const label = `${viewport.width} × ${viewport.height} の ${category} の ${i + 1} 番目の見本の ${s + 1} 段目`;
              const step = `${String(s + 1).padStart(2, "0")}/${String(steps).padStart(2, "0")}`;
              await expect
                .poll(async () => {
                  const seen = await overlayFigureOf(page);
                  if (!seen) return null;
                  const follow = seen.view === "follow";
                  // 全体図は出す時だけ枠の中かを見る。携帯の幅の縦長の全体図は出さない (#3055)
                  return { step: seen.step, scrolls: seen.scrolls, figure: seen.figure, window: follow ? seen.window : true, overview: follow ? seen.overview !== false : true };
                }, { ...WAIT, message: `${label} を重ね窓で開くと、送らないと図の全体が見えない` })
                .toEqual({ step, scrolls: false, figure: true, window: true, overview: true });
              if (s < steps - 1) await page.locator('[data-catalog="overlay"] [data-dragon="next"]').click();
            }
            await page.keyboard.press("Escape");
            await expect.poll(() => overlayFigureOf(page), { ...WAIT, message: `${category} の ${i + 1} 番目の見本の重ね窓が閉じない` }).toBeNull();
          }
        }
      }
    },
    SLOW,
  );

  it(
    "overlay-figure-steady-across-steps",
    async () => {
      // 段の本文の行の数で帯の高さが替わり、図が縮むか上下に動いていた大きさを全部含める (#3049)
      const sizes = [
        { width: 390, height: 844 },
        { width: 860, height: 900 },
        { width: 1024, height: 768 },
        { width: 1280, height: 720 },
        { width: 1440, height: 900 },
      ];
      for (const category of ["architecture", "sequence"] as const) {
        const count = samplesOf(category).length;
        for (const viewport of sizes) {
          const { page } = await site.open({ path: `${BASE}catalog/${category}`, viewport });
          await page.emulateMedia({ reducedMotion: "reduce" });
          await onScreen(page, "category", `${viewport.width} × ${viewport.height} で ${category} の分類の頁が出ない`);
          for (let i = 0; i < count; i++) {
            const label = `${viewport.width} × ${viewport.height} の ${category} の ${i + 1} 番目の見本の重ね窓`;
            await page.locator(catalogSel("item")).nth(i).click();
            await page.locator(catalogSel("expand")).click();
            const steps = page.locator('[data-catalog="overlay"] [data-dragon="steps"] > li');
            await expect.poll(() => steps.count(), { ...WAIT, message: `${label} が開かない` }).toBeGreaterThan(0);
            // 段が 1 つだけの見本は送る先が無い
            if ((await steps.count()) > 1) await expectSteadyAcrossSteps(page, '[data-catalog="overlay"]', label);
            await page.keyboard.press("Escape");
            await expect.poll(() => page.locator('[data-catalog="overlay"]').count(), { ...WAIT, message: `${label} が閉じない` }).toBe(0);
          }
        }
      }
    },
    SLOW,
  );

  it(
    "overlay-caption-clear-of-bottom-edge",
    async () => {
      // 段の本文の帯の下に余白が無く、本文の最後の行が重ね窓の札の縁に接していた (#3051)
      const sizes = [
        { width: 390, height: 844 },
        { width: 860, height: 900 },
        { width: 1024, height: 768 },
        { width: 1280, height: 720 },
        { width: 1440, height: 900 },
      ];
      for (const category of ["architecture", "sequence"] as const) {
        const count = samplesOf(category).length;
        for (const viewport of sizes) {
          const { page } = await site.open({ path: `${BASE}catalog/${category}`, viewport });
          await onScreen(page, "category", `${viewport.width} × ${viewport.height} で ${category} の分類の頁が出ない`);
          for (let i = 0; i < count; i++) {
            const label = `${viewport.width} × ${viewport.height} の ${category} の ${i + 1} 番目の見本の重ね窓`;
            await page.locator(catalogSel("item")).nth(i).click();
            await page.locator(catalogSel("expand")).click();
            await expect
              .poll(() => captionClearance(page, '[data-catalog="overlay"]', ".catalog-overlay-card"), { ...WAIT, message: `${label} で、本文の最後の行と札の下の縁の間が 8px に足りない` })
              .toBeGreaterThanOrEqual(8);
            await page.keyboard.press("Escape");
            await expect.poll(() => page.locator('[data-catalog="overlay"]').count(), { ...WAIT, message: `${label} が閉じない` }).toBe(0);
          }
        }
      }
    },
    SLOW,
  );

  it(
    "overlay-low-screen-keeps-whole-figure",
    async () => {
      // 帯に余白を足して図の枠を低くすると、低い画面で構成図の全体が見えず寄って追う図に替わる (#3051)
      const { page } = await site.open({ path: `${BASE}catalog/architecture`, viewport: { width: 1280, height: 720 } });
      await onScreen(page, "category", "1280 × 720 で構成図の分類の頁が出ない");
      await page.locator(catalogSel("item")).first().click();
      await page.locator(catalogSel("expand")).click();
      const shape = await settledStepShape(page, '[data-catalog="overlay"]', "1280 × 720 の構成図の 1 番目の見本の重ね窓");
      expect(shape.view, "1280 × 720 の構成図の重ね窓が、全体を止めて見せる図でない").toBe("fixed");
    },
    SLOW,
  );

  /**
   * 重ね窓の寄って追う図の窓が見せる図の横の割合 (1 なら横幅の全部) と、窓の高さと図の枠の中で見える高さの差と、
   * 図が枠の中に送らずに収まるか (#3053)。2 回続けて同じ値を読めた時だけ返す
   */
  const followWindowOf = (page: Page): Promise<{ view: string | null; shown: number; gap: number; inside: boolean } | null> =>
    page.evaluate(async () => {
      await document.fonts.ready;
      const read = () => {
        const frameEl = document.querySelector<HTMLElement>('[data-catalog="overlay"] .dg-frame');
        const svg = frameEl?.querySelector('svg[data-dragon="figure"]');
        if (!frameEl || !svg) return null;
        const num = (selector: string, name: string): number => Number(svg.querySelector(selector)?.getAttribute(name) ?? Number.NaN);
        const style = getComputedStyle(frameEl);
        const frame = frameEl.getBoundingClientRect();
        const box = svg.getBoundingClientRect();
        // 図の属性の寸法を、画面に描かれた寸法へ直す倍率
        const scale = box.height / Number(svg.getAttribute("height"));
        const room = frameEl.clientHeight - Number.parseFloat(style.paddingTop) - Number.parseFloat(style.paddingBottom);
        return {
          view: svg.getAttribute("data-view"),
          // 全体図の中の今見ている所の枠の幅と、全体図に描いた図の幅の比
          shown: Math.round((num(".dg-mm-vp", "width") / num(".dg-mm-world", "width")) * 1000) / 1000,
          gap: Math.round((num(".dg-vp-frame", "height") + 1) * scale - room),
          inside:
            box.left >= frame.left - 0.5 &&
            box.right <= frame.right + 0.5 &&
            box.top >= frame.top - 0.5 &&
            box.bottom <= frame.bottom + 0.5 &&
            frameEl.scrollHeight <= frameEl.clientHeight + 1,
        };
      };
      const frame = () => new Promise((done) => requestAnimationFrame(done));
      const first = read();
      await frame();
      await frame();
      const second = read();
      return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
    });

  /** 時系列図の分類の頁で oauth の見本を重ね窓で開く */
  const openOauthOverlay = async (viewport: { width: number; height: number }): Promise<Page> => {
    const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport });
    await onScreen(page, "category", `${viewport.width} × ${viewport.height} で時系列図の分類の頁が出ない`);
    await page.locator(catalogSel("item")).nth(samplesOf("sequence").indexOf("oauth")).click();
    await page.locator(catalogSel("expand")).click();
    return page;
  };

  it(
    "overlay-follow-window-shows-whole-width",
    async () => {
      // 窓と全体図を図の原寸の幅に収めていたため、枠が余っても右端の API の札が窓で切れていた (#3053)
      for (const viewport of [
        { width: 1024, height: 768 },
        { width: 1280, height: 720 },
        { width: 1440, height: 900 },
      ]) {
        const page = await openOauthOverlay(viewport);
        await expect
          .poll(async () => {
            const seen = await followWindowOf(page);
            return seen && { view: seen.view, shown: seen.shown };
          }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の oauth の重ね窓で、窓が図の横幅の全部を見せない` })
          .toEqual({ view: "follow", shown: 1 });
      }
    },
    SLOW,
  );

  it(
    "overlay-follow-window-fills-frame-height",
    async () => {
      // 窓の高さが幅から決めた高さで止まり、枠の下が空いていた (#3053)
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 1440, height: 900 },
      ]) {
        const page = await openOauthOverlay(viewport);
        await expect
          .poll(async () => {
            const seen = await followWindowOf(page);
            return seen && { view: seen.view, gap: Math.abs(seen.gap) <= 1 ? 0 : seen.gap, inside: seen.inside };
          }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の oauth の重ね窓で、窓の高さが図の枠の中で見える高さと合わないか、図が枠に収まらない` })
          .toEqual({ view: "follow", gap: 0, inside: true });
      }
    },
    SLOW,
  );

  /**
   * 置き場 `scope` の寄って追う図の全体図の数と、窓の幅と図の枠の中の幅の差と、図が枠の中に送らずに収まるか (#3055)。
   * 2 回続けて同じ値を読めた時だけ返す
   */
  const narrowFollowOf = (page: Page, scope: string): Promise<{ view: string | null; overview: number; gap: number; inside: boolean } | null> =>
    page.evaluate(async (scope) => {
      await document.fonts.ready;
      const read = () => {
        const frameEl = document.querySelector<HTMLElement>(`${scope} .dg-frame`);
        const svg = frameEl?.querySelector('svg[data-dragon="figure"]');
        const win = svg?.querySelector(".dg-vp-frame");
        if (!frameEl || !svg || !win) return null;
        const style = getComputedStyle(frameEl);
        const frame = frameEl.getBoundingClientRect();
        const box = svg.getBoundingClientRect();
        // 図の属性の寸法を、画面に描かれた寸法へ直す倍率
        const scale = box.width / Number(svg.getAttribute("width"));
        const room = frameEl.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
        return {
          view: svg.getAttribute("data-view"),
          overview: svg.querySelectorAll(".dg-mm-bg").length,
          gap: Math.round((Number(win.getAttribute("width")) + 1) * scale - room),
          inside:
            box.left >= frame.left - 0.5 &&
            box.right <= frame.right + 0.5 &&
            box.top >= frame.top - 0.5 &&
            box.bottom <= frame.bottom + 0.5 &&
            frameEl.scrollHeight <= frameEl.clientHeight + 1,
        };
      };
      const frame = () => new Promise((done) => requestAnimationFrame(done));
      const first = read();
      await frame();
      await frame();
      const second = read();
      return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
    }, scope);

  it(
    "narrow-follow-window-fills-frame-width",
    async () => {
      // 携帯の幅では縦長の全体図の列が枠の幅の 3 割を取り、窓が oauth の横の 3 割ほどしか見せなかった (#3055)
      const oauth = exampleText("oauth", "ja");
      for (const viewport of [
        { width: 360, height: 780 },
        { width: 390, height: 844 },
        { width: 430, height: 932 },
      ]) {
        const size = `${viewport.width} × ${viewport.height}`;
        const expectWide = async (page: Page, scope: string, where: string): Promise<void> => {
          await expect
            .poll(async () => {
              const seen = await narrowFollowOf(page, scope);
              return seen && { view: seen.view, overview: seen.overview, gap: Math.abs(seen.gap) <= 1 ? 0 : seen.gap, inside: seen.inside };
            }, { ...WAIT, message: `${size} の${where}の oauth で、全体図が残るか、窓が枠の幅いっぱいでないか、図が枠に収まらない` })
            .toEqual({ view: "follow", overview: 0, gap: 0, inside: true });
        };
        const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport });
        await onScreen(page, "category", `${size} で時系列図の分類の頁が出ない`);
        await page.locator(catalogSel("item")).nth(samplesOf("sequence").indexOf("oauth")).click();
        await expectWide(page, '[data-catalog="stage"]', "カタログの頁の見本の枠");
        await page.locator(catalogSel("expand")).click();
        await expectWide(page, '[data-catalog="overlay"]', "拡大の重ね窓");
        const editor = await site.open({ path: `${BASE}editor${toHash(oauth)}`, viewport });
        await expectWide(editor.page, '[data-playground="stage"]', "編集画面");
      }
    },
    SLOW,
  );

  /** 帯の並べ方を確かめる見本。時系列図の oauth と、本文の最も長い段が長い構成図の ccip */
  const CAPTION_SAMPLES = [
    { key: "oauth", category: "sequence" },
    { key: "ccip", category: "architecture" },
  ] as const satisfies readonly { key: ExampleKey; category: Kind }[];

  /** 分類の頁で見本 `key` を選ぶ。`still` の時は動きを嫌う設定で開き、段を釦で送れるようにする */
  const openItem = async (viewport: { width: number; height: number }, sample: (typeof CAPTION_SAMPLES)[number], still = false): Promise<Page> => {
    const { page } = await site.open({ path: `${BASE}catalog/${sample.category}`, viewport });
    if (still) await page.emulateMedia({ reducedMotion: "reduce" });
    await onScreen(page, "category", `${viewport.width} × ${viewport.height} で ${sample.category} の分類の頁が出ない`);
    await page.locator(catalogSel("item")).nth(samplesOf(sample.category).indexOf(sample.key)).click();
    return page;
  };

  /** 分類の頁で見本 `key` を重ね窓で開く。`still` の時は動きを嫌う設定で開き、段を釦で送れるようにする */
  const openOverlay = async (viewport: { width: number; height: number }, sample: (typeof CAPTION_SAMPLES)[number], still = false): Promise<Page> => {
    const page = await openItem(viewport, sample, still);
    await page.locator(catalogSel("expand")).click();
    return page;
  };

  /** 見本 `key` を編集画面で開く。`still` の時は動きを嫌う設定で開き直し、段を釦で送れるようにする */
  const openEditor = async (viewport: { width: number; height: number }, key: ExampleKey, still = false): Promise<Page> => {
    const { page } = await site.open({ path: `${BASE}editor${toHash(exampleText(key, "ja"))}`, viewport });
    if (still) {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.reload();
    }
    return page;
  };

  interface CaptionBox {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }

  /**
   * 置き場 `scope` の段の本文の帯の高さ、図の枠の中の高さ、帯の左右の余白を除いた中身の左端と右端、釦と段の番号と今の段の題と本文の箱、
   * 全部の段の写しの題と本文が帯の中身の幅に収まるか (#3057)。2 回続けて同じ値を読めた時だけ返す
   */
  const captionOf = (
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

  it(
    "narrow-overlay-caption-lower",
    async () => {
      // 携帯の幅では釦と番号と題と本文を横 1 列に並べ、本文の欄が細って帯が高くなり、重ね窓の図の枠を押し下げていた (#3057)
      const before = {
        "360 × 780": { oauth: { bar: 191, frame: 398 }, ccip: { bar: 211, frame: 355 } },
        "390 × 844": { oauth: { bar: 151, frame: 502 }, ccip: { bar: 191, frame: 462 } },
      } as const;
      for (const viewport of [
        { width: 360, height: 780 },
        { width: 390, height: 844 },
      ]) {
        const size = `${viewport.width} × ${viewport.height}` as keyof typeof before;
        for (const sample of CAPTION_SAMPLES) {
          const page = await openOverlay(viewport, sample);
          const now = before[size][sample.key];
          await expect
            .poll(async () => {
              const seen = await captionOf(page, '[data-catalog="overlay"]');
              return seen && { lower: seen.bar < now.bar, taller: seen.frame > now.frame };
            }, { ...WAIT, message: `${size} の ${sample.key} の重ね窓で、帯が ${now.bar}px より低くならないか、図の枠の中が ${now.frame}px より高くならない` })
            .toEqual({ lower: true, taller: true });
        }
      }
    },
    SLOW,
  );

  it(
    "narrow-caption-steady-and-inside",
    async () => {
      // 携帯の幅で帯の並べ方を替えても、段を送った時に帯と図が動かず、題と本文が帯からはみ出さない (#3049、#3057)
      for (const viewport of [
        { width: 360, height: 780 },
        { width: 390, height: 844 },
        { width: 430, height: 932 },
      ]) {
        const size = `${viewport.width} × ${viewport.height}`;
        for (const sample of CAPTION_SAMPLES) {
          for (const [where, scope, page] of [
            ["重ね窓", '[data-catalog="overlay"]', await openOverlay(viewport, sample, true)],
            ["編集画面", '[data-playground="stage"]', await openEditor(viewport, sample.key, true)],
          ] as const) {
            const label = `${size} の${where}の ${sample.key}`;
            await expect.poll(async () => (await captionOf(page, scope))?.inside, { ...WAIT, message: `${label} で、題か本文が帯の中身の幅からはみ出す` }).toBe(true);
            await expectSteadyAcrossSteps(page, scope, label);
          }
        }
      }
    },
    SLOW,
  );

  it(
    "wide-caption-stays-one-row",
    async () => {
      // 帯の中身の幅が 440px 以上の時は、釦と番号と題と本文を横 1 列に並べる今の形のまま (#3057)
      for (const viewport of [
        { width: 560, height: 900 },
        { width: 1440, height: 900 },
      ]) {
        const size = `${viewport.width} × ${viewport.height}`;
        for (const sample of CAPTION_SAMPLES) {
          for (const [where, scope, page] of [
            ["重ね窓", '[data-catalog="overlay"]', await openOverlay(viewport, sample)],
            ["編集画面", '[data-playground="stage"]', await openEditor(viewport, sample.key)],
          ] as const) {
            await expect
              .poll(async () => {
                const seen = await captionOf(page, scope);
                if (!seen) return null;
                const { buttons, no, title, body } = seen;
                return {
                  titleBesideButtons: title.left > buttons.right && title.top < buttons.bottom,
                  noBesideButtons: no.left > buttons.right && no.right <= title.left && no.top < buttons.bottom,
                  bodyUnderTitle: body.top >= title.bottom && Math.abs(body.left - title.left) <= 1,
                };
              }, { ...WAIT, message: `${size} の${where}の ${sample.key} で、帯が横 1 列でない` })
              .toEqual({ titleBesideButtons: true, noBesideButtons: true, bodyUnderTitle: true });
          }
        }
      }
    },
    SLOW,
  );

  /**
   * 重ね窓の見出しの高さ、図の枠の中の高さ、題の字と題が切れずに全部見えるか、説明が見えるかと説明の字、
   * 題と閉じる釦が見出しの中に収まって重ならないか (#3059)。2 回続けて同じ値を読めた時だけ返す
   */
  const overlayHeadOf = (
    page: Page,
  ): Promise<{ head: number; frame: number; title: string; whole: boolean; desc: string | null; fits: boolean } | null> =>
    page.evaluate(async () => {
      await document.fonts.ready;
      const read = () => {
        const root = document.querySelector('[data-catalog="overlay"]');
        const head = root?.querySelector(".catalog-overlay-head");
        const title = root?.querySelector<HTMLElement>('[data-catalog="overlay-title"]');
        const close = root?.querySelector('[data-catalog="overlay-close"]');
        const frameEl = root?.querySelector<HTMLElement>(".dg-frame");
        if (!head || !title || !close || !frameEl || !frameEl.querySelector('svg[data-dragon="figure"]')) return null;
        const desc = root?.querySelector<HTMLElement>(".catalog-overlay-desc");
        const h = head.getBoundingClientRect();
        const t = title.getBoundingClientRect();
        const c = close.getBoundingClientRect();
        const inHead = (r: DOMRect): boolean => r.left >= h.left - 0.5 && r.right <= h.right + 0.5 && r.top >= h.top - 0.5 && r.bottom <= h.bottom + 0.5;
        const style = getComputedStyle(frameEl);
        return {
          head: Math.round(h.height),
          frame: Math.round(frameEl.clientHeight - Number.parseFloat(style.paddingTop) - Number.parseFloat(style.paddingBottom)),
          title: title.textContent?.trim() ?? "",
          whole: title.checkVisibility() && title.scrollHeight <= title.clientHeight + 1 && title.scrollWidth <= title.clientWidth + 1,
          desc: desc?.checkVisibility() ? (desc.textContent?.trim() ?? "") : null,
          fits: inHead(t) && inHead(c) && t.right <= c.left,
        };
      };
      const frame = () => new Promise((done) => requestAnimationFrame(done));
      const first = read();
      await frame();
      await frame();
      const second = read();
      return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
    });

  const PHONES = [
    { width: 360, height: 780 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ] as const;

  it(
    "narrow-overlay-head-title-only",
    async () => {
      // 携帯の幅では重ね窓の見出しに題と説明を折り返して出し、見出しが 107 から 156px を取って図の枠を押し下げていた (#3059)
      for (const viewport of PHONES) {
        for (const sample of CAPTION_SAMPLES) {
          const page = await openOverlay(viewport, sample);
          const title = sampleOf(exampleText(sample.key, "ja"))?.title;
          await expect
            .poll(async () => {
              const seen = await overlayHeadOf(page);
              return seen && { title: seen.title, whole: seen.whole, desc: seen.desc };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の ${sample.key} の重ね窓で、見出しに説明が見えるか、題が切れる` })
            .toEqual({ title, whole: true, desc: null });
        }
      }
    },
    SLOW,
  );

  it(
    "narrow-overlay-head-lower",
    async () => {
      // 携帯の幅の重ね窓では、見出しが低くなった分だけ図の枠が高くなる (#3059)
      const before = {
        "360 × 780": { oauth: { head: 133, frame: 472 }, ccip: { head: 156, frame: 435 } },
        "390 × 844": { oauth: { head: 133, frame: 542 }, ccip: { head: 133, frame: 522 } },
      } as const;
      for (const viewport of PHONES.slice(0, 2)) {
        const size = `${viewport.width} × ${viewport.height}` as keyof typeof before;
        for (const sample of CAPTION_SAMPLES) {
          const page = await openOverlay(viewport, sample);
          const now = before[size][sample.key];
          await expect
            .poll(async () => {
              const seen = await overlayHeadOf(page);
              return seen && { lower: seen.head < now.head, taller: seen.frame > now.frame };
            }, { ...WAIT, message: `${size} の ${sample.key} の重ね窓で、見出しが ${now.head}px より低くならないか、図の枠の中が ${now.frame}px より高くならない` })
            .toEqual({ lower: true, taller: true });
        }
      }
    },
    SLOW,
  );

  it(
    "narrow-overlay-head-close-works",
    async () => {
      // 携帯の幅で見出しを替えても、題と閉じる釦が見出しに収まり、閉じる釦で閉じる (#3059)
      for (const viewport of PHONES) {
        for (const sample of CAPTION_SAMPLES) {
          const page = await openOverlay(viewport, sample);
          const label = `${viewport.width} × ${viewport.height} の ${sample.key} の重ね窓`;
          await expect.poll(async () => (await overlayHeadOf(page))?.fits, { ...WAIT, message: `${label} で、題か閉じる釦が見出しからはみ出すか、2 つが重なる` }).toBe(true);
          await page.locator(catalogSel("overlay-close")).click();
          await expect.poll(() => page.locator(catalogSel("overlay")).count(), { ...WAIT, message: `${label} が閉じる釦で閉じない` }).toBe(0);
        }
      }
    },
    SLOW,
  );

  it(
    "wide-overlay-head-keeps-description",
    async () => {
      // 560px 以上の画面の重ね窓は、今と同じく見出しに題と説明を出す (#3059)
      for (const viewport of [
        { width: 560, height: 900 },
        { width: 1440, height: 900 },
      ]) {
        for (const sample of CAPTION_SAMPLES) {
          const page = await openOverlay(viewport, sample);
          await expect
            .poll(async () => {
              const seen = await overlayHeadOf(page);
              return seen && { title: seen.title.length > 0, desc: (seen.desc ?? "").length > 0 };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の ${sample.key} の重ね窓で、見出しに題か説明が見えない` })
            .toEqual({ title: true, desc: true });
        }
      }
    },
    SLOW,
  );

  /**
   * 編集画面の図の側の上の部分 (#3061)。段の札が見える時はその字、図の枠の上の余白、道具の帯と図の枠の中の間、
   * 最初の画面に見える記法の欄の高さ、道具の帯に重なる箱と図の枠の中の上端より上に出る箱の数、前の図を出している旨の札が見えるかと、
   * その札に重なる箱の数。寄って追う窓は窓の外の箱を左右と下で枠の外に置くので、上の向きだけを数える。
   * 重なりは 0.5px までを許す。2 回続けて同じ値を読めた時だけ返す
   */
  const editorTopOf = (
    page: Page,
  ): Promise<{ badge: string | null; pad: number; above: number; code: number; underTools: number; overTop: number; kept: boolean; covered: number } | null> =>
    page.evaluate(async () => {
      await document.fonts.ready;
      const read = () => {
        const stage = document.querySelector('[data-playground="stage"]');
        const tools = stage?.querySelector(".pg-stage-bar");
        const frameEl = stage?.querySelector<HTMLElement>(".dg-frame");
        const foot = stage?.querySelector(".pg-stage-foot");
        const boxes = [...(frameEl?.querySelectorAll('svg[data-dragon="figure"] rect.dg-st') ?? [])].map((r) => r.getBoundingClientRect());
        if (!tools || !frameEl || !foot || boxes.length === 0) return null;
        const badge = stage?.querySelector<HTMLElement>('[data-playground="phase-badge"]');
        const kept = stage?.querySelector(".pg-kept");
        const t = tools.getBoundingClientRect();
        const f = frameEl.getBoundingClientRect();
        const pad = Number.parseFloat(getComputedStyle(frameEl).paddingTop);
        const hit = (a: DOMRect, b: DOMRect): boolean => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
        const keptBox = kept?.checkVisibility() ? kept.getBoundingClientRect() : null;
        return {
          badge: badge?.checkVisibility() ? (badge.textContent?.trim() ?? "") : null,
          pad: Math.round(pad),
          above: Math.round(f.top + pad - t.bottom),
          code: Math.round(innerHeight - foot.getBoundingClientRect().bottom),
          underTools: boxes.filter((b) => hit(b, t)).length,
          overTop: boxes.filter((b) => b.top < f.top + pad - 0.5).length,
          kept: keptBox !== null,
          covered: keptBox ? boxes.filter((b) => hit(b, keptBox)).length : 0,
        };
      };
      const frame = () => new Promise((done) => requestAnimationFrame(done));
      const first = read();
      await frame();
      await frame();
      const second = read();
      return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
    });

  /** 段の札の字が、見本 `key` のどれかの段の `段 {N} / {全体} · {題}` と同じか */
  const badgeOfSample = (text: string | null | undefined, key: ExampleKey): boolean => {
    const parsed = parseNotation(exampleText(key, "ja"));
    const titles = parsed.ok ? parsed.diagram.steps.map((s) => s.title) : [];
    return titles.length > 1 && titles.some((title, i) => TEXT.ja.stage.phase(i + 1, titles.length, title) === text);
  };

  it(
    "narrow-editor-hides-phase-badge",
    async () => {
      // 携帯の幅の編集画面では、段の札がすぐ下の段の本文の帯と同じ番号と題を 2 回並べ、枠の上に 48px を取っていた (#3061)
      for (const viewport of PHONES) {
        for (const sample of CAPTION_SAMPLES) {
          const page = await openEditor(viewport, sample.key, true);
          await expect
            .poll(async () => (await editorTopOf(page))?.badge, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${sample.key} で、段の札が見える` })
            .toBeNull();
        }
      }
    },
    SLOW,
  );

  it(
    "narrow-editor-figure-starts-higher",
    async () => {
      // 札を出さない分だけ図の枠の上の余白が詰まり、記法の欄が最初の画面に多く見える (#3061)
      const before = {
        "360 × 780": { oauth: 93, ccip: -41 },
        "390 × 844": { oauth: 163, ccip: 16 },
      } as const;
      for (const viewport of PHONES.slice(0, 2)) {
        const size = `${viewport.width} × ${viewport.height}` as keyof typeof before;
        for (const sample of CAPTION_SAMPLES) {
          const page = await openEditor(viewport, sample.key, true);
          const code = before[size][sample.key];
          await expect
            .poll(async () => {
              const seen = await editorTopOf(page);
              return seen && { closer: seen.above < 48, more: seen.code > code };
            }, { ...WAIT, message: `${size} の編集画面の ${sample.key} で、道具の帯と図の枠の中の間が 48px より小さくならないか、見える記法の欄が ${code}px より高くならない` })
            .toEqual({ closer: true, more: true });
        }
      }
    },
    SLOW,
  );

  it(
    "narrow-editor-figure-clear-of-toolbar",
    async () => {
      // 枠の上の余白を詰めても、図の箱は道具の帯に重ならず、図の枠の中の上端より上に出ない (#3061)
      for (const viewport of PHONES) {
        for (const sample of CAPTION_SAMPLES) {
          const page = await openEditor(viewport, sample.key, true);
          await expect
            .poll(async () => {
              const seen = await editorTopOf(page);
              return seen && { underTools: seen.underTools, overTop: seen.overTop };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${sample.key} で、図の箱が道具の帯に重なるか、図の枠の中の上端より上に出る` })
            .toEqual({ underTools: 0, overTop: 0 });
        }
      }
    },
    SLOW,
  );

  it(
    "narrow-editor-kept-notice-keeps-room",
    async () => {
      // 記法に誤りがあり前の図を出している間は、その旨の札のために枠の上の余白を今のまま取る (#3061)
      const viewport = { width: 390, height: 844 };
      for (const sample of CAPTION_SAMPLES) {
        const broken = `${exampleText(sample.key, "ja")}\n!!! 読めない行\n`;
        expect(parseNotation(broken).ok, "検査に使う記法が誤りにならない").toBe(false);
        const page = await openEditor(viewport, sample.key, true);
        await expect.poll(async () => (await editorTopOf(page))?.kept, { ...WAIT, message: `編集画面の ${sample.key} の図が描かれない` }).toBe(false);
        await page.locator('[data-playground="editor"]').fill(broken);
        await expect
          .poll(async () => {
            const seen = await editorTopOf(page);
            return seen && { kept: seen.kept, pad: seen.pad, covered: seen.covered };
          }, { ...WAIT, message: `390 × 844 の編集画面の ${sample.key} で、前の図を出している旨の札が出ないか、枠の上の余白が 48px でないか、札が箱に重なる` })
          .toEqual({ kept: true, pad: 48, covered: 0 });
      }
    },
    SLOW,
  );

  it(
    "wide-editor-keeps-phase-badge",
    async () => {
      // 440px 以上の編集画面は、今と同じく段の札を出し、枠の上に 48px を取る (#3061)
      for (const viewport of [
        { width: 560, height: 900 },
        { width: 1440, height: 900 },
      ]) {
        for (const sample of CAPTION_SAMPLES) {
          const page = await openEditor(viewport, sample.key, true);
          await expect
            .poll(async () => {
              const seen = await editorTopOf(page);
              return seen && { badge: badgeOfSample(seen.badge, sample.key), pad: seen.pad };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${sample.key} で、段の札が出ないか、枠の上の余白が 48px でない` })
            .toEqual({ badge: true, pad: 48 });
        }
      }
    },
    SLOW,
  );

  it(
    "catalog-preview-keeps-phase-badge",
    async () => {
      // カタログの頁の見本の枠では帯が段の題を出さないので、携帯の幅でも札を出す (#3061)
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 1440, height: 900 },
      ]) {
        for (const sample of CAPTION_SAMPLES) {
          const page = await openItem(viewport, sample);
          await expect
            .poll(
              async () =>
                badgeOfSample(
                  await page.evaluate(() => {
                    const badge = document.querySelector<HTMLElement>('[data-catalog="preview"] [data-catalog="phase-badge"]');
                    return badge?.checkVisibility() ? (badge.textContent?.trim() ?? "") : null;
                  }),
                  sample.key,
                ),
              { ...WAIT, message: `${viewport.width} × ${viewport.height} のカタログの頁の ${sample.key} の見本の枠で、段の札が出ない` },
            )
            .toBe(true);
        }
      }
    },
    SLOW,
  );

  /** 編集画面の道具の帯の道具。左から今の並び (#3063) */
  const STAGE_TOOLS = ["font-down", "font-up", "grid", "fullscreen", "fit", "zoom-out", "zoom-in", "zoom-level"] as const;

  /** 携帯の幅の道具の帯の道具。合わせるの釦を出さず、倍率を縮小と拡大の間の釦にする (#3065) */
  const PHONE_TOOLS = ["font-down", "font-up", "grid", "fullscreen", "zoom-out", "zoom-level", "zoom-in"] as const;

  /** 記法の欄の上の帯の部品。左から今の並び (#3065) */
  const CODE_PARTS = ["shelf-toggle", "tab-notation", "tab-json", "file-name", "import", "export", "fold"] as const;

  /** 道具の帯を確かめる見本。図を枠に合わせて描く intro と、携帯の幅で寄って追う窓で描く oauth */
  const TOOL_SAMPLES = ["intro", "oauth"] as const satisfies readonly ExampleKey[];

  /**
   * 編集画面の道具の帯 (#3063)。帯を横に送る分の幅、見えている部品の名前の並び (実況表示の札は `live`、色味の丸と道具は `data-playground` の名前)、
   * 見えていて帯の中に収まらない部品、倍率の字。2 回続けて同じ値を読めた時だけ返す
   */
  const toolsOf = (page: Page): Promise<{ hidden: number; shown: string[]; cut: string[]; level: string } | null> =>
    page.evaluate(async () => {
      await document.fonts.ready;
      const read = () => {
        const stage = document.querySelector('[data-playground="stage"]');
        const bar = stage?.querySelector(".pg-stage-bar");
        if (!bar || !stage?.querySelector('svg[data-dragon="figure"]')) return null;
        const b = bar.getBoundingClientRect();
        const parts = [...bar.querySelectorAll<HTMLElement>(".pg-live, [data-playground]")].filter((el) => el.checkVisibility());
        const name = (el: HTMLElement): string => (el.classList.contains("pg-live") ? "live" : (el.dataset.playground ?? ""));
        return {
          hidden: bar.scrollWidth - bar.clientWidth,
          shown: parts.map(name),
          cut: parts
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.left < b.left - 0.5 || r.right > b.right + 0.5;
            })
            .map(name),
          level: bar.querySelector('[data-playground="zoom-level"]')?.textContent?.trim() ?? "",
        };
      };
      const frame = () => new Promise((done) => requestAnimationFrame(done));
      const first = read();
      await frame();
      await frame();
      const second = read();
      return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
    });

  it(
    "narrow-editor-tools-fit-one-row",
    async () => {
      // 携帯の幅の道具の帯は並べるのに 487px 要り、拡大の釦と倍率が画面の外に出て、帯を送れることも分からなかった (#3063)。
      // 合わせるの釦は倍率の釦が持つ (#3065)
      for (const viewport of PHONES) {
        for (const key of TOOL_SAMPLES) {
          const page = await openEditor(viewport, key, true);
          await expect
            .poll(async () => {
              const seen = await toolsOf(page);
              return seen && { scrolls: seen.hidden > 0, tools: PHONE_TOOLS.every((tool) => seen.shown.includes(tool)), cut: seen.cut };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${key} で、道具の帯を送る分が残るか、道具が帯からはみ出す` })
            .toEqual({ scrolls: false, tools: true, cut: [] });
        }
      }
    },
    SLOW,
  );

  it(
    "narrow-editor-tools-hide-live-and-swatches",
    async () => {
      // 携帯の幅では実況表示の札と色味の丸を出さず、道具を 1 列に収める。色味は上の帯の切替で替える (#3063)
      for (const viewport of PHONES) {
        const page = await openEditor(viewport, "intro", true);
        await expect
          .poll(async () => {
            const seen = await toolsOf(page);
            return seen && { live: seen.shown.includes("live"), swatches: seen.shown.filter((n) => n.startsWith("palette-")) };
          }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面で、実況表示の札か色味の丸が見える` })
          .toEqual({ live: false, swatches: [] });
      }
    },
    SLOW,
  );

  it(
    "narrow-editor-tools-zoom-works",
    async () => {
      // 携帯の幅でも、図を枠に合わせて描く見本では拡大と縮小が働き、頁は横にあふれない (#3063)。
      // 合わせるは倍率の釦が持ち、`narrow-editor-zoom-level-fits` が確かめる (#3065)
      const page = await openEditor({ width: 360, height: 780 }, "intro", true);
      const level = async (): Promise<number> => Number.parseInt((await toolsOf(page))?.level ?? "", 10);
      const overflows = (): Promise<boolean> => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      await expect.poll(level, { ...WAIT, message: "360 × 780 の編集画面の intro で、倍率が出ない" }).toBeGreaterThan(0);
      const base = await level();
      await page.locator('[data-playground="zoom-in"]').click();
      await expect.poll(level, { ...WAIT, message: "拡大の釦で倍率が上がらない" }).toBeGreaterThan(base);
      const larger = await level();
      expect(await overflows(), "拡大すると頁が横にあふれる").toBe(false);
      await page.locator('[data-playground="zoom-out"]').click();
      await expect.poll(level, { ...WAIT, message: "縮小の釦で倍率が下がらない" }).toBeLessThan(larger);
      expect(await overflows(), "頁が横にあふれる").toBe(false);
    },
    SLOW,
  );

  /**
   * 編集画面の 2 つの帯 (道具の帯と記法の欄の上の帯) の押せる部品 (#3065)。部品ごとに `data-playground` の名前、幅と高さ、
   * 四隅から 2px 内側 (角の丸み 3px の外を避ける) を押した時にその部品に当たるか。帯を画面に入れてから読み、2 回続けて同じ値を読めた時だけ返す
   */
  const targetsOf = (page: Page): Promise<{ name: string; width: number; height: number; corners: boolean }[] | null> =>
    page.evaluate(async () => {
      await document.fonts.ready;
      const bars = [...document.querySelectorAll<HTMLElement>(".pg-stage-bar, .pg-bar")];
      const read = () => {
        if (bars.length !== 2 || !document.querySelector('[data-playground="stage"] svg[data-dragon="figure"]')) return null;
        return bars.flatMap((bar) => {
          bar.scrollIntoView({ block: "nearest" });
          return [...bar.querySelectorAll<HTMLElement>("button[data-playground], input[data-playground]")]
            .filter((el) => el.checkVisibility())
            .map((el) => {
              const r = el.getBoundingClientRect();
              const corners = [
                [r.left + 2, r.top + 2],
                [r.right - 2, r.top + 2],
                [r.left + 2, r.bottom - 2],
                [r.right - 2, r.bottom - 2],
              ].every(([x, y]) => {
                const hit = document.elementFromPoint(x, y);
                return hit !== null && el.contains(hit);
              });
              return { name: el.dataset.playground ?? "", width: Math.round(r.width), height: Math.round(r.height), corners };
            });
        });
      };
      const frame = () => new Promise((done) => requestAnimationFrame(done));
      const first = read();
      await frame();
      await frame();
      const second = read();
      return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
    });

  it(
    "narrow-editor-bars-touch-targets",
    async () => {
      // 携帯の幅の 2 つの帯の釦は 30 × 30px で隣との間が 4px しか無く、指で隣を押し違えやすかった (#3065)。指で押す的の目安は 44 × 44px
      const required = [...PHONE_TOOLS, ...CODE_PARTS];
      for (const viewport of PHONES) {
        for (const key of TOOL_SAMPLES) {
          const page = await openEditor(viewport, key, true);
          await expect
            .poll(async () => {
              const parts = await targetsOf(page);
              return (
                parts && {
                  missing: required.filter((name) => !parts.some((p) => p.name === name)),
                  small: parts.filter((p) => p.width < 44 || p.height < 44 || !p.corners).map((p) => `${p.name} ${p.width}x${p.height}${p.corners ? "" : " 隅が外れる"}`),
                }
              );
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${key} で、押せる部品が揃わないか、44px に届かない部品がある` })
            .toEqual({ missing: [], small: [] });
        }
      }
    },
    SLOW,
  );

  it(
    "narrow-editor-zoom-level-fits",
    async () => {
      // 44px の釦を 1 列に収めるため、携帯の幅では合わせるの釦を出さず、倍率を縮小と拡大の間の釦にして、押すと枠に合わせる (#3065)
      for (const viewport of PHONES) {
        const page = await openEditor(viewport, "intro", true);
        const where = `${viewport.width} × ${viewport.height} の編集画面の intro`;
        await expect.poll(async () => (await toolsOf(page))?.shown, { ...WAIT, message: `${where} で、道具の帯の並びが違う` }).toEqual([...PHONE_TOOLS]);
        const level = async (): Promise<number> => Number.parseInt((await toolsOf(page))?.level ?? "", 10);
        const base = await level();
        expect(base, `${where} で、倍率が出ない`).toBeGreaterThan(0);
        await page.locator('[data-playground="zoom-in"]').click();
        await expect.poll(level, { ...WAIT, message: `${where} で、拡大の釦で倍率が上がらない` }).toBeGreaterThan(base);
        await page.locator('[data-playground="zoom-level"]').click();
        await expect.poll(level, { ...WAIT, message: `${where} で、倍率の釦で元の倍率に戻らない` }).toBe(base);
      }
      const page = await openEditor({ width: 360, height: 780 }, "oauth", true);
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const el = document.querySelector('[data-playground="stage"] svg[data-dragon="figure"]') && document.querySelector('.pg-stage-bar [data-playground="zoom-level"]');
              return el ? { button: el instanceof HTMLButtonElement, disabled: el instanceof HTMLButtonElement && el.disabled, text: el.textContent?.trim() ?? "" } : null;
            }),
          { ...WAIT, message: "360 × 780 の編集画面の oauth で、倍率が押せない状態の釦でないか、「—」を出さない" },
        )
        .toEqual({ button: true, disabled: true, text: "—" });
    },
    SLOW,
  );

  /** 記法の欄の上の帯を送る分の幅、見えている部品の名前の並び、帯の中に収まらない部品 (#3065) */
  const codeBarOf = (page: Page): Promise<{ hidden: number; shown: string[]; cut: string[] } | null> =>
    page.evaluate(async () => {
      await document.fonts.ready;
      const bar = document.querySelector(".pg-bar");
      if (!bar) return null;
      const b = bar.getBoundingClientRect();
      const parts = [...bar.querySelectorAll<HTMLElement>("[data-playground]")].filter((el) => el.checkVisibility());
      return {
        hidden: bar.scrollWidth - bar.clientWidth,
        shown: parts.map((el) => el.dataset.playground ?? ""),
        cut: parts
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.left < b.left - 0.5 || r.right > b.right + 0.5;
          })
          .map((el) => el.dataset.playground ?? ""),
      };
    });

  it(
    "narrow-editor-code-bar-works",
    async () => {
      // 携帯の幅で記法の欄の上の帯の部品を 44px にしても、1 列に収まり、切替の札と畳むの釦が今と同じに働く (#3065)
      for (const viewport of PHONES) {
        const page = await openEditor(viewport, "intro", true);
        const where = `${viewport.width} × ${viewport.height} の編集画面`;
        await expect
          .poll(async () => {
            const seen = await codeBarOf(page);
            return seen && { scrolls: seen.hidden > 0, shown: seen.shown, cut: seen.cut };
          }, { ...WAIT, message: `${where} で、記法の欄の上の帯を送る分が残るか、部品が揃わないか、帯からはみ出す` })
          .toEqual({ scrolls: false, shown: [...CODE_PARTS], cut: [] });
        await page.locator('[data-playground="tab-json"]').click();
        await expect
          .poll(() => page.locator('[data-playground="editor"]').inputValue(), { ...WAIT, message: `${where} で、JSON の札で JSON の側に替わらない` })
          .toMatch(/^\s*\{/);
        await page.locator('[data-playground="fold"]').click();
        await expect
          .poll(() => page.evaluate(() => document.querySelector<HTMLElement>(".pg-code-body")?.hidden ?? null), { ...WAIT, message: `${where} で、畳むの釦で書く欄が畳まれない` })
          .toBe(true);
      }
    },
    SLOW,
  );

  it(
    "narrow-editor-site-palette-recolors-figure",
    async () => {
      // 携帯の幅では編集画面の色味の丸を出さないので、上の帯の畳んだ面の切替で図の色味を替える (#3063)
      const { page } = await site.open({ path: `${BASE}editor${toHash(exampleText("oauth", "ja"))}`, viewport: { width: 390, height: 844 }, colorScheme: "light" });
      await onScreen(page, "editor", "390 × 844 で編集画面が出ない");
      await expect.poll(() => figureLooks(page, '[data-playground="stage"]'), { ...WAIT, message: "編集画面の図が紙と墨で描かれない" }).toEqual([figureLook("paper", "light")]);
      await page.locator(siteSel("menu")).click();
      await page.locator(`${siteSel("sheet-palette")} ${siteSel("palette-night")}`).click();
      await expect
        .poll(() => figureLooks(page, '[data-playground="stage"]'), { ...WAIT, message: "畳んだ面の色味の切替で、編集画面の図が夜の計器で描かれない" })
        .toEqual([figureLook("night", "light")]);
    },
    SLOW,
  );

  it(
    "wide-editor-tools-keep-all",
    async () => {
      // 440px 以上の編集画面の道具の帯は、実況表示の札と色味の丸と道具を今と同じ並びで 1 列に出す (#3063)
      const all = ["live", ...PALETTE_IDS.map((id) => `palette-${id}`), ...STAGE_TOOLS];
      for (const viewport of [
        { width: 560, height: 900 },
        { width: 1440, height: 900 },
      ]) {
        for (const key of TOOL_SAMPLES) {
          const page = await openEditor(viewport, key, true);
          await expect
            .poll(async () => {
              const seen = await toolsOf(page);
              return seen && { scrolls: seen.hidden > 0, shown: seen.shown, cut: seen.cut };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${key} で、道具の帯の並びが今と違うか、帯からはみ出す` })
            .toEqual({ scrolls: false, shown: all, cut: [] });
        }
      }
    },
    SLOW,
  );

  it(
    "wide-editor-bars-keep-size",
    async () => {
      // 440px 以上の編集画面の 2 つの帯は、部品の大きさを今のまま保ち、倍率を字で出す (#3065)
      for (const viewport of [
        { width: 560, height: 900 },
        { width: 1440, height: 900 },
      ]) {
        const page = await openEditor(viewport, "intro", true);
        await expect
          .poll(
            () =>
              page.evaluate(async () => {
                await document.fonts.ready;
                const visible = (sel: string): Element[] => [...document.querySelectorAll(sel)].filter((el) => el.checkVisibility());
                const height = (el: Element | null): number | null => (el ? Math.round(el.getBoundingClientRect().height) : null);
                return {
                  tools: [
                    ...new Set(
                      visible(".pg-stage-bar .pg-tool, .pg-bar .pg-tool").map((el) => {
                        const r = el.getBoundingClientRect();
                        return `${Math.round(r.width)}x${Math.round(r.height)}`;
                      }),
                    ),
                  ],
                  tabs: visible('.pg-bar [role="tab"]').map(height),
                  file: height(document.querySelector('.pg-bar [data-playground="file-name"]')),
                  level: document.querySelector('.pg-stage-bar [data-playground="zoom-level"]')?.tagName.toLowerCase() ?? null,
                };
              }),
            { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面で、2 つの帯の部品の大きさが今と違うか、倍率が字で出ない` },
          )
          .toEqual({ tools: ["30x30"], tabs: [27, 27], file: 26, level: "span" });
      }
    },
    SLOW,
  );

  it(
    "category-item-shows-source",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "category", "時系列図の分類の頁が出ない");
      const key = samplesOf("sequence")[0] as ExampleKey;
      const source = (): Promise<string | null> => page.evaluate(() => document.querySelector('[data-catalog="source-code"]')?.textContent ?? null);
      const shown = (): Promise<{ stage: boolean; source: boolean; tab: string | null }> =>
        page.evaluate(() => {
          const visible = (s: string): boolean => {
            const e = document.querySelector<HTMLElement>(s);
            return e !== null && e.checkVisibility();
          };
          return {
            stage: visible('[data-catalog="stage"]'),
            source: visible('[data-catalog="source"]'),
            tab: document.querySelector('[data-catalog="preview"] [role="tab"][aria-selected="true"]')?.getAttribute("data-catalog") ?? null,
          };
        });

      await expect.poll(shown, { ...WAIT, message: "分類の頁が図の見出しで開かない" }).toEqual({ stage: true, source: false, tab: "tab-figure" });

      // コードの見出しで、図の代わりに記法の本文を出す
      await page.locator(catalogSel("tab-code")).click();
      await expect.poll(shown, { ...WAIT, message: "コードの見出しで記法の本文に替わらない" }).toEqual({ stage: false, source: true, tab: "tab-code" });
      await expect.poll(source, { ...WAIT, message: "コードの見出しの本文が見本の記法でない" }).toBe(exampleText(key, "ja"));
      expect(await page.locator(catalogSel("source-notation")).getAttribute("aria-pressed"), "記法の側が選ばれていない").toBe("true");

      // JSON の側に替えると、原本の JSON を出す
      await page.locator(catalogSel("source-json")).click();
      await expect.poll(source, { ...WAIT, message: "JSON の側に替えても原本の JSON が出ない" }).toBe(jsonOf(exampleText(key, "ja")));
      expect(await page.locator(catalogSel("source-json")).getAttribute("aria-pressed"), "JSON の側が選ばれていない").toBe("true");

      // 写す釦で、選んだ側の本文を写す
      await page.evaluate(() => {
        const w = window as unknown as { __copied: string | null };
        w.__copied = null;
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: (text: string): Promise<void> => {
              w.__copied = text;
              return Promise.resolve();
            },
          },
        });
      });
      await page.locator(catalogSel("copy")).click();
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { __copied: string | null }).__copied), { ...WAIT, message: "写す釦で JSON の本文を写さない" })
        .toBe(jsonOf(exampleText(key, "ja")));

      // 記法の側に戻して英語に替えると、英語の見本の記法になる
      await page.locator(catalogSel("source-notation")).click();
      await page.locator(siteSel("lang-en")).click();
      await expect.poll(source, { ...WAIT, message: "英語に替えてもコードの見出しの記法が英語の見本にならない" }).toBe(exampleText(key, "en"));

      // 図の見出しに戻すと、図に戻る
      await page.locator(catalogSel("tab-figure")).click();
      await expect.poll(shown, { ...WAIT, message: "図の見出しで図に戻らない" }).toEqual({ stage: true, source: false, tab: "tab-figure" });
    },
    SLOW,
  );

  it(
    "category-item-opens-overlay-and-editor",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "category", "時系列図の分類の頁が出ない");
      const key = samplesOf("sequence").at(-1) as ExampleKey;
      const text = exampleText(key, "ja");
      const sample = sampleOf(text);
      await page.locator(catalogSel("item")).last().click();
      await expect.poll(async () => (await categoryOf(page)).title, { ...WAIT, message: "選んだ見本が右に出ない" }).toBe(sample?.title);

      const overlay = (): Promise<{ covers: boolean; title: string; names: string[]; figures: number; larger: boolean } | null> =>
        page.evaluate(() => {
          const o = document.querySelector('[data-catalog="overlay"]');
          if (!o || !(o as HTMLElement).checkVisibility()) return null;
          const r = o.getBoundingClientRect();
          const svg = o.querySelector('svg[data-dragon="figure"]');
          const inStage = document.querySelector('[data-catalog="stage"] svg[data-dragon="figure"]');
          return {
            covers: r.left <= 0 && r.top <= 0 && r.right >= innerWidth && r.bottom >= innerHeight,
            title: o.querySelector('[data-catalog="overlay-title"]')?.textContent?.trim() ?? "",
            names: svg ? [...new Set([...svg.querySelectorAll(".dg-sn")].map((n) => n.textContent ?? ""))].sort() : [],
            figures: o.querySelectorAll('svg[data-dragon="figure"]').length,
            larger: svg !== null && inStage !== null && svg.getBoundingClientRect().width > inStage.getBoundingClientRect().width,
          };
        });
      const opened = { covers: true, title: sample?.title ?? "", names: sample?.names ?? [], figures: 1, larger: true };

      // 拡大の釦で、画面を覆う重ね窓に図 1 つが大きく出る
      await page.locator(catalogSel("expand")).click();
      await expect.poll(overlay, { ...WAIT, message: "拡大の釦で重ね窓に図が大きく出ない" }).toEqual(opened);
      // 閉じる釦で閉じる
      await page.locator(catalogSel("overlay-close")).click();
      await expect.poll(overlay, { ...WAIT, message: "閉じる釦で重ね窓が閉じない" }).toBeNull();
      // Escape でも閉じる
      await page.locator(catalogSel("expand")).click();
      await expect.poll(overlay, { ...WAIT, message: "もう一度押しても重ね窓が開かない" }).toEqual(opened);
      await page.keyboard.press("Escape");
      await expect.poll(overlay, { ...WAIT, message: "Escape で重ね窓が閉じない" }).toBeNull();

      // 編集画面で開くと、頁を読み直さずにその記法が入った編集画面が開く
      await page.evaluate(() => {
        (window as unknown as { __stay: number }).__stay = 1;
      });
      await page.locator(catalogSel("open-editor")).click();
      await onScreen(page, "editor", "編集画面で開くで編集画面が出ない");
      await expect
        .poll(() => page.evaluate(() => document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ?? null), {
          ...WAIT,
          message: "編集画面で開いても見本の記法が書く欄に入らない",
        })
        .toBe(text);
      expect(await page.evaluate(() => location.hash), "編集画面のアドレスに記法が載らない").toBe(toHash(text));
      expect(await page.evaluate(() => (window as unknown as { __stay?: number }).__stay), "編集画面で開く時に頁を読み直した").toBe(1);
    },
    SLOW,
  );

  it(
    "catalog-samples-all-valid",
    async () => {
      for (const lang of ["ja", "en"] as const) {
        const { page } = await site.open({ path: `${BASE}catalog`, locale: lang === "ja" ? "ja-JP" : "en-US" });
        await onScreen(page, "catalog", "カタログの一覧が出ない");
        await expect.poll(async () => (await cardsOf(page)).length, { ...WAIT, message: "カタログの一覧に分類の札が無い" }).toBeGreaterThan(0);
        const hrefs = (await cardsOf(page)).map((c) => c.href);
        const errors: string[] = [];
        let total = 0;
        for (const href of hrefs) {
          await page.goto(`${site.origin}${href}`);
          await onScreen(page, "category", `${href} で分類の頁が出ない`);
          await expect.poll(async () => (await categoryOf(page)).items.length, { ...WAIT, message: `${href} に見本が無い` }).toBeGreaterThan(0);
          const items = (await categoryOf(page)).items;
          for (const [i, item] of items.entries()) {
            await page.locator(catalogSel("item")).nth(i).click();
            await expect.poll(async () => (await categoryOf(page)).title, { ...WAIT, message: `${href} の「${item.title}」が右に出ない` }).toBe(item.title);
            await page.locator(catalogSel("tab-code")).click();
            await page.locator(catalogSel("source-notation")).click();
            const text = (await page.locator(catalogSel("source-code")).textContent()) ?? "";
            const parsed = parseNotation(text);
            if (!parsed.ok) {
              errors.push(`${lang} ${href}「${item.title}」が記法として読めない: ${parsed.errors.map((e) => `${e.line} 行目 ${e.message}`).join(" / ")}`);
              continue;
            }
            const read = readDiagram(parsed.diagram);
            if (!read.ok) errors.push(`${lang} ${href}「${item.title}」が schema の検査で落ちる: ${read.errors.map((e) => `${e.pointer} ${e.message}`).join(" / ")}`);
            total += 1;
            await page.locator(catalogSel("tab-figure")).click();
          }
        }
        expect(errors, `${lang} のカタログに読めない見本がある`).toEqual([]);
        expect(total, `${lang} のカタログに載る見本の数が見本の数と合わない`).toBe(EXAMPLE_KEYS.length);
      }
    },
    SWEEP,
  );

  it(
    "category-palette-overrides-one-diagram",
    async () => {
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport: { width: 1440, height: 900 }, colorScheme: "light" });
      await onScreen(page, "category", "時系列図の分類の頁が出ない");
      const stageLook = (): Promise<string[]> => figureLooks(page, catalogSel("stage"));
      const pick = (value: string): Promise<string[]> => page.locator(catalogSel("palette")).selectOption(value);

      // 色味の切替は「サイトと同じ」と 3 つの色味。最初は「サイトと同じ」で、帯の色味で描く
      expect(
        await page.evaluate(() => [...document.querySelectorAll<HTMLOptionElement>('[data-catalog="palette"] option')].map((o) => o.value)),
        "見本の色味の切替が「サイトと同じ」と 3 つの色味でない",
      ).toEqual(["site", ...PALETTE_IDS]);
      expect(await page.locator(catalogSel("palette")).inputValue(), "見本の色味の切替が「サイトと同じ」で始まらない").toBe("site");
      await expect.poll(stageLook, { ...WAIT, message: "見本の図が帯の色味で描かれない" }).toEqual([figureLook(DEFAULT_PALETTE, "light")]);

      // 見本の色味を選ぶと、その図だけが替わり、サイトの色は替わらない
      await pick("night");
      await expect.poll(stageLook, { ...WAIT, message: "見本の色味を夜の計器にしても図が替わらない" }).toEqual([figureLook("night", "light")]);
      expect(await colorsOf(page), "見本の色味を選ぶとサイトの色まで替わった").toEqual(rgbOf(siteLook(DEFAULT_PALETTE, "light")));

      // 帯の色味を替えてから「サイトと同じ」に戻すと、帯の色味で描く
      await page.locator(`${siteSel("palette")} ${siteSel("palette-clear")}`).click();
      await pick("site");
      await expect.poll(stageLook, { ...WAIT, message: "「サイトと同じ」に戻しても帯の色味で描かれない" }).toEqual([figureLook("clear", "light")]);
    },
    SLOW,
  );

  it(
    "site-palette-switch-recolors-site-and-diagrams",
    async () => {
      const { page } = await site.open({ path: BASE, viewport: { width: 1440, height: 900 }, colorScheme: "light" });
      await onScreen(page, "home", "概要の頁が出ない");
      const header = `${siteSel("header")} ${siteSel("palette")}`;
      const switchOf = (): Promise<{ id: string; pressed: boolean; label: string | null }[]> =>
        page.evaluate(
          (s) =>
            [...document.querySelectorAll<HTMLButtonElement>(`${s} button`)].map((b) => ({
              id: b.dataset.site ?? "",
              pressed: b.getAttribute("aria-pressed") === "true",
              label: b.getAttribute("aria-label"),
            })),
          header,
        );
      const pressedOnly = (id: string): { id: string; pressed: boolean; label: string | null }[] =>
        PALETTE_IDS.map((p) => ({ id: `palette-${p}`, pressed: p === id, label: TEXT.ja.paletteNames[p] ?? null }));

      // 帯に 3 つの色味が並び、紙と墨を選んでいる
      expect(await switchOf(), "帯の色味の切替が 3 つの色味でないか、紙と墨を選んでいない").toEqual(pressedOnly(DEFAULT_PALETTE));

      // 色味を選ぶと、サイトの色と頁の全部の図が替わる
      const figures = 1 + EXAMPLE_KEYS.length;
      for (const id of PALETTE_IDS) {
        await page.locator(`${header} ${siteSel(`palette-${id}`)}`).click();
        await expect.poll(() => colorsOf(page), { ...WAIT, message: `${id} を選んでもサイトの色が替わらない` }).toEqual(rgbOf(siteLook(id, "light")));
        await expect.poll(() => figureLooks(page), { ...WAIT, message: `${id} を選んでも概要の図が替わらない` }).toEqual(Array(figures).fill(figureLook(id, "light")));
        expect(await switchOf(), `${id} を選んだ印が付かない`).toEqual(pressedOnly(id));
      }

      // 色味を選んだ後に明暗を切り替えると、選んだ色味の暗い側になる
      await page.locator(`${header} ${siteSel("palette-clear")}`).click();
      await page.locator(siteSel("theme")).click();
      await expect.poll(() => colorsOf(page), { ...WAIT, message: "澄んだ色で明暗を替えても暗い側の値にならない" }).toEqual(rgbOf(siteLook("clear", "dark")));
      await expect.poll(() => figureLooks(page), { ...WAIT, message: "澄んだ色で明暗を替えても図が暗い側にならない" }).toEqual(Array(figures).fill(figureLook("clear", "dark")));

      // 頁を開き直しても選んだ色味が残る。明暗は端末の設定に戻る
      await page.reload();
      await onScreen(page, "home", "開き直した概要の頁が出ない");
      await expect.poll(() => colorsOf(page), { ...WAIT, message: "開き直すと選んだ色味が残らない" }).toEqual(rgbOf(siteLook("clear", "light")));
      expect(await switchOf(), "開き直すと選んだ色味の印が残らない").toEqual(pressedOnly("clear"));

      // 編集画面とカタログの図も帯の色味で描く
      await page.locator(`${siteSel("nav")} a`, { hasText: "編集画面" }).click();
      await onScreen(page, "editor", "帯から編集画面へ移れない");
      await expect.poll(() => figureLooks(page, '[data-playground="stage"]'), { ...WAIT, message: "編集画面の図が帯の色味で描かれない" }).toEqual([figureLook("clear", "light")]);
      await page.goto(`${site.origin}${BASE}catalog/sequence`);
      await onScreen(page, "category", "分類の頁が出ない");
      await expect.poll(() => figureLooks(page, catalogSel("stage")), { ...WAIT, message: "分類の頁の図が帯の色味で描かれない" }).toEqual([figureLook("clear", "light")]);

      // 幅 720 以下では、畳んだ行き先の面の中で色味を切り替える
      const narrow = await site.open({ path: BASE, viewport: { width: 390, height: 844 }, colorScheme: "light" });
      await onScreen(narrow.page, "home", "幅 390 で概要の頁が出ない");
      expect(await narrow.page.locator(header).isVisible(), "幅 390 で帯の色味の切替が畳まれない").toBe(false);
      await narrow.page.locator(siteSel("menu")).click();
      await narrow.page.locator(`${siteSel("sheet-palette")} ${siteSel("palette-night")}`).click();
      await expect.poll(() => colorsOf(narrow.page), { ...WAIT, message: "畳んだ面の色味の切替でサイトの色が替わらない" }).toEqual(rgbOf(siteLook("night", "light")));
    },
    SLOW,
  );

  it(
    "docs-sections-cover-notation-and-examples-parse",
    async () => {
      const { page } = await site.open({ path: `${BASE}docs`, viewport: { width: 1440, height: 900 } });
      await onScreen(page, "docs", "使い方の頁が出ない");

      // 前置き。見出しと前置きの文と、編集画面とカタログへの釦
      await expect.poll(async () => (await docsOf(page)).title, { ...WAIT, message: "使い方の頁に見出しが無い" }).toBe(TEXT.ja.site.screens.docs.title);
      const head = await docsOf(page);
      expect(head.lead, "使い方の頁に前置きの文が無い").not.toBe("");
      expect(head.ctas, "前置きの釦が編集画面とカタログへ向かない").toEqual([`${BASE}editor`, `${BASE}catalog`]);

      const commands = readmeCommands();
      const options = cliOptions();
      expect(commands.length, "package の README から命令を読めない").toBeGreaterThan(0);
      expect(options.length, "書き出しの命令の使い方の表示から設定を読めない").toBeGreaterThan(0);

      const expectDocs = async (lang: Lang): Promise<void> => {
        // 節の例は file に置き、どれも読めて検査を通り、その節で説明する要素を使う。記法の例は頁の言葉の語で書く
        const words = lang === "ja" ? ["時系列図", "構成図"] : ["sequence", "architecture"];
        const want = DOC_SECTIONS.map((id, i) => {
          const text = id === "export" ? undefined : docsExample(id, lang);
          const diagram = text === undefined ? undefined : docsDiagram(id, text);
          if (id !== "export") {
            expect(text, `${lang} の ${id} の節の例の file (src/docs/examples/) が無い`).toBeDefined();
            expect(diagram, `${lang} の ${id} の節の例が読めないか検査を通らない`).toBeDefined();
            expect(diagram !== undefined && DOC_COVERS[id]?.(diagram), `${lang} の ${id} の節の例がその節の記法の要素を使わない`).toBe(true);
          }
          if (text !== undefined && id !== "json") {
            const first = text.split("\n").find((line) => line.trim() !== "" && !line.startsWith("//")) ?? "";
            expect(words, `${lang} の ${id} の節の例が頁の言葉の語で書かれない`).toContain(first.split(" ")[0]);
          }
          return { id, no: String(i + 1).padStart(2, "0"), code: text ?? null, names: diagram ? [...new Set(diagram.boxes.map((b) => b.name))].sort() : [] };
        });

        // 節は今の記法の要素の順に並び、番号は並びから付く。例の字は file のままで、隣の図はその例の箱を描く
        await expect
          .poll(async () => (await docsOf(page)).sections.map((s) => ({ id: s.id, no: s.no, code: s.code?.trimEnd() ?? null, names: s.names })), {
            ...WAIT,
            message: `${lang} の使い方の節が記法の要素の順に並ばないか、例の字と図が file の例と合わない`,
          })
          .toEqual(want);
        const { sections, cards } = await docsOf(page);
        for (const s of sections) {
          expect(s.title !== "" && s.texts >= 1, `${lang} の ${s.id} の節に見出しか本文が無い`).toBe(true);
          const [path, hash] = (s.cta ?? "").split("#");
          expect(s.cta?.startsWith(BASE), `${lang} の ${s.id} の節にサイトの中への出口が無い`).toBe(true);
          if (hash !== undefined) expect(path === `${BASE}docs` && (DOC_SECTIONS as readonly string[]).includes(hash), `${lang} の ${s.id} の節の出口が使い方の節を指さない`).toBe(true);
        }

        // 書き出しの節は、README と同じ命令を図を描かない囲みに出し、命令の使い方の表示にある設定をすべて説明する
        const exporting = sections.find((s) => s.id === "export");
        const lines = (exporting?.commands ?? []).flatMap((c) => c.split("\n")).map((line) => line.trim()).filter((line) => line !== "");
        for (const line of commands.filter((l) => !l.startsWith("dragon "))) expect(lines, `${lang} の書き出しの節に README の命令「${line}」が無い`).toContain(line);
        expect(lines.some((line) => line.startsWith("dragon export ")), `${lang} の書き出しの節に dragon export の命令が無い`).toBe(true);
        for (const option of options) expect(exporting?.body ?? "", `${lang} の書き出しの節に設定 ${option} の説明が無い`).toContain(option);

        // 特長の札 6 つ。名前は行き先の節の見出しで、説明を持つ
        expect(cards.length, `${lang} の特長の札が 6 つ並ばない`).toBe(6);
        expect(new Set(cards.map((c) => c.href)).size, `${lang} の特長の札の行き先が重なる`).toBe(cards.length);
        for (const c of cards) {
          const target = sections.find((s) => `#${s.id}` === c.href);
          expect(target, `${lang} の特長の札「${c.name}」の行き先 ${c.href} が節でない`).toBeDefined();
          expect(c.name, `${lang} の特長の札の名前が行き先の節の見出しでない`).toBe(target?.title);
          expect(c.text, `${lang} の特長の札「${c.name}」に説明が無い`).not.toBe("");
        }
      };
      await expectDocs("ja");

      // 特長の札を押すと、同じ頁のその節へ移る
      const card = page.locator(docsSel("card")).last();
      const href = (await docsOf(page)).cards.at(-1)?.href ?? "";
      await card.click();
      await expect.poll(() => page.evaluate(() => location.hash), { ...WAIT, message: "特長の札を押してもアドレスが節を指さない" }).toBe(href);
      expect(await page.evaluate(() => location.pathname), "特長の札を押すと使い方の頁から離れる").toBe(`${BASE}docs`);
      await expect
        .poll(
          () =>
            page.evaluate((id) => {
              const top = document.getElementById(id)?.getBoundingClientRect().top;
              return top !== undefined && top >= 0 && top < window.innerHeight / 2;
            }, href.slice(1)),
          { ...WAIT, message: "特長の札を押しても行き先の節が画面の上に来ない" },
        )
        .toBe(true);

      // 英語に替えると、節の例が英語の語の記法になる
      await page.locator(siteSel("lang-en")).click();
      await expect.poll(async () => (await docsOf(page)).title, { ...WAIT, message: "英語に替えても使い方の見出しが英語にならない" }).toBe(TEXT.en.site.screens.docs.title);
      await expectDocs("en");
    },
    SLOW,
  );

  it(
    "version-badge-from-package",
    async () => {
      expect(VERSION, "packages/dragon/package.json から版を読めない").toMatch(/^v\d+\.\d+$/u);
      const eyebrowOf = (page: Page, sel: string): Promise<string> => page.evaluate((s) => document.querySelector(s)?.textContent?.trim() ?? "", sel);
      for (const lang of ["ja", "en"] as const) {
        const locale = lang === "ja" ? "ja-JP" : "en-US";
        // 概要の呼びかけの版の札
        const home = await site.open({ path: BASE, locale });
        await onScreen(home.page, "home", "概要の頁が出ない");
        await expect.poll(() => eyebrowOf(home.page, homeSel("version")), { ...WAIT, message: `${lang} の概要の版の札が package の版でない` }).toBe(VERSION);
        // 更新履歴の前置きの札
        const release = await site.open({ path: `${BASE}release-notes`, locale });
        await onScreen(release.page, "release-notes", "更新履歴の頁が出ない");
        await expect.poll(async () => wordsOf((await releaseOf(release.page)).eyebrow), { ...WAIT, message: `${lang} の更新履歴の札に package の版が無い` }).toContain(VERSION);
        // 使い方の前置きの札
        const docs = await site.open({ path: `${BASE}docs`, locale });
        await onScreen(docs.page, "docs", "使い方の頁が出ない");
        await expect.poll(async () => wordsOf(await eyebrowOf(docs.page, docsSel("eyebrow"))), { ...WAIT, message: `${lang} の使い方の札に package の版が無い` }).toContain(VERSION);
      }
    },
    SLOW,
  );

  it(
    "release-notes-shows-version-and-changelog-link",
    async () => {
      const changelog = `${REPO}/blob/main/CHANGELOG.md`;
      expect(existsSync(join(root, "CHANGELOG.md")), "釦が指す CHANGELOG.md が repo に無い").toBe(true);
      for (const lang of ["ja", "en"] as const) {
        const { page } = await site.open({ path: `${BASE}release-notes`, locale: lang === "ja" ? "ja-JP" : "en-US" });
        await onScreen(page, "release-notes", "更新履歴の頁が出ない");
        await expect.poll(async () => (await releaseOf(page)).title, { ...WAIT, message: `${lang} の更新履歴の見出しが出ない` }).toBe(TEXT[lang].site.screens["release-notes"].title);
        const release = await releaseOf(page);
        expect(release.crumb, `${lang} の更新履歴の道筋が概要へ戻らない`).toEqual([BASE]);
        expect(wordsOf(release.eyebrow), `${lang} の更新履歴の札に版が無い`).toContain(VERSION);
        expect(release.lead, `${lang} の更新履歴に説明が無い`).not.toBe("");
        // 釦は変更の記録を GitHub で見る 1 つだけで、新しいタブで開く
        expect(release.links.map((l) => l.href), `${lang} の更新履歴の釦が変更の記録 1 つでない`).toEqual([changelog]);
        expect(release.links[0]?.text, `${lang} の更新履歴の釦に名前が無い`).not.toBe("");
        expect(release.links[0]?.target, `${lang} の更新履歴の釦が新しいタブで開かない`).toBe("_blank");
        expect(release.links[0]?.rel, `${lang} の更新履歴の釦が開いた先に頁を渡す`).toContain("noopener");
      }
    },
    SLOW,
  );

  it(
    "not-found-counts-destinations",
    async () => {
      const destinations = [`${BASE}editor`, `${BASE}catalog`, `${BASE}docs`];
      for (const lang of ["ja", "en"] as const) {
        const path = `${BASE}no-such-page`;
        const { page } = await site.open({ path, locale: lang === "ja" ? "ja-JP" : "en-US" });
        await onScreen(page, "not-found", "見つからない頁が出ない");
        await expect.poll(async () => (await notFoundOf(page)).code, { ...WAIT, message: `${lang} の見つからない頁に大きな 404 が無い` }).toBe("404");
        const nf = await notFoundOf(page);
        expect(nf.title, `${lang} の見つからない頁に見出しが無い`).not.toBe("");
        expect(nf.links, `${lang} の見つからない頁の釦が編集画面とカタログと使い方へ向かない`).toEqual(destinations);
        // 説明が言う入口の数は、並んだ釦の数
        const said = [...nf.lead.matchAll(/\d+/gu)].map((m) => Number(m[0]));
        expect(said, `${lang} の見つからない頁の説明の入口の数が釦の数 ${nf.links.length} と合わない (${nf.lead})`).toEqual([nf.links.length]);
        expect(nf.path, `${lang} の見つからない頁に開いた path が出ない`).toBe(path);
      }
    },
    SLOW,
  );
});
