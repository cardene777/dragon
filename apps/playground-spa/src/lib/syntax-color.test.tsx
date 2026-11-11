// @vitest-environment jsdom
/**
 * 編集画面の書く欄の色付け (#3613)。
 *
 * 書く欄 (`textarea`) の下に色の層を敷き、記法と JSON の字を語の役ごとの色で描く。
 * 記法は図の種類の名前、行の頭の語、`as`、線の `->`、設定の鍵、設定の値、注釈、`code` の命令の 8 つの役、
 * JSON は鍵、字の列、数、真偽と `null`、括弧の 5 つの役に分ける。
 * 行の頭の語と図の種類の名前は記法の読み取りが持つ語の一覧 (`@cardenelabs/dragon` の `NOTATION_WORDS`) から引く。
 * 役ごとの色はサイトの意匠の明暗の値から引き、書く欄の地との濃さの比が足りない時だけ字の色へ寄せる。
 *
 * 色の層の部品と色の表が無い間も file を読み込めるよう、どちらも名前を値にして後から読む。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Playground } from "../Playground";
import * as siteColors from "../site/site-colors";
import { root as REPO } from "./playground-support";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** jsdom は大きさを測らないので、大きさの見張りは何も知らせない物で置き換える */
class QuietObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= QuietObserver as unknown as typeof ResizeObserver;
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

type Span = { text: string; role?: string };
interface Highlight {
  paintNotation: (text: string, words: { kinds: readonly string[]; heads: readonly string[] }) => Span[][];
  paintJson: (text: string) => Span[][];
}

/** 色付けの部品の置き場。無い間も file を読み込めるよう、名前を値にして読む */
const HIGHLIGHT_MODULE = "../editor/highlight";

async function highlight(): Promise<Highlight> {
  let mod: Partial<Highlight> | undefined;
  try {
    mod = (await import(/* @vite-ignore */ HIGHLIGHT_MODULE)) as Partial<Highlight>;
  } catch {
    mod = undefined;
  }
  expect(mod?.paintNotation, "記法を役ごとに分ける部品 (`editor/highlight.ts` の `paintNotation`) が無い").toBeTypeOf("function");
  expect(mod?.paintJson, "JSON を役ごとに分ける部品 (`editor/highlight.ts` の `paintJson`) が無い").toBeTypeOf("function");
  return mod as Highlight;
}

/** 記法の読み取りが持つ語の一覧 */
function readerWords(): { kinds: readonly string[]; heads: readonly string[] } {
  const words = (dragon as { NOTATION_WORDS?: { kinds: readonly string[]; heads: readonly string[] } }).NOTATION_WORDS;
  expect(words, "`@cardenelabs/dragon` が記法の語の一覧 (`NOTATION_WORDS`) を出さない").toBeDefined();
  return words ?? { kinds: [], heads: [] };
}

/** 役ごとの色の表。名前は役、値は色 */
function colorsOf(palette: string, theme: "light" | "dark"): Record<string, string> {
  const make = (siteColors as { syntaxColors?: (p: string, t: "light" | "dark") => Record<string, string> }).syntaxColors;
  expect(make, "役ごとの色を引く関数 (`site/site-colors.ts` の `syntaxColors`) が無い").toBeTypeOf("function");
  return make?.(palette, theme) ?? {};
}

const NOTATION_ROLES = ["kind", "head", "as", "arrow", "key", "value", "comment", "code"] as const;
const JSON_ROLES = ["json-key", "json-string", "json-number", "json-literal"] as const;
const THEMES = ["light", "dark"] as const;
const PALETTE_NAMES = Object.keys(dragon.PALETTES);

/** 色の明るさ (WCAG の相対輝度) */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h.slice(0, 6);
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string): number => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

let host: HTMLDivElement;
let mounted: Root | undefined;

const wait = async (ms: number): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

/** 条件が成り立つまで待つ。後から読む塊 (見本の記法、棚の字) が届くまでに使う */
async function until(ready: () => boolean, what: string): Promise<void> {
  for (let i = 0; i < 100 && !ready(); i += 1) await wait(50);
  expect(ready(), `${what} が届かない`).toBe(true);
}

const area = (): HTMLTextAreaElement => {
  const el = host.querySelector<HTMLTextAreaElement>('[data-playground="editor"]');
  expect(el, "書く欄が無い").not.toBeNull();
  return el as HTMLTextAreaElement;
};
const paint = (): HTMLElement | null => host.querySelector<HTMLElement>('[data-playground="paint"]');
const spansOf = (role: string): string[] => [...(paint()?.querySelectorAll<HTMLElement>(`[data-syn="${role}"]`) ?? [])].map((el) => el.textContent ?? "");

/** 人が打ったのと同じく、書く欄の字を替えて入力の知らせを出す */
function type(value: string): void {
  // React は書く欄の値の setter を差し替えて変化を見るので、元の setter で書いてから入力を知らせる
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set?.bind(area());
  act(() => {
    setValue?.(value);
    area().dispatchEvent(new Event("input", { bubbles: true }));
  });
}

beforeAll(async () => {
  host = document.createElement("div");
  document.body.append(host);
  mounted = createRoot(host);
  act(() => mounted?.render(<Playground lang="ja" theme="light" palette="paper" onBeforeLang={() => undefined} />));
  await wait(100);
});

afterAll(() => {
  act(() => mounted?.unmount());
  host.remove();
});

const SAMPLE = ["// 注釈の行", "sequence 色付けの見本", "box a as 窓口 [color: blue]", "box b", "step 送る", "  code GET /x", "  a -> b: 送る [carry: token]"].join("\n");

describe("書く欄の色付け (#3613)", () => {
  it("syntax-notation-roles", () => {
    type(SAMPLE);
    expect(paint(), "書く欄の下に色の層が無い").not.toBeNull();
    expect(spansOf("kind")).toContain("sequence");
    expect(spansOf("head")).toContain("box");
    expect(spansOf("as")).toContain("as");
    expect(spansOf("arrow")).toContain("->");
    expect(spansOf("key")).toContain("carry");
    expect(spansOf("value")).toContain("token");
    expect(spansOf("comment")).toContain("// 注釈の行");
    expect(spansOf("code").join("")).toContain("GET /x");
  });

  it("syntax-notation-colors-differ", () => {
    for (const palette of PALETTE_NAMES) {
      for (const theme of THEMES) {
        const colors = colorsOf(palette, theme);
        const values = NOTATION_ROLES.map((role) => colors[role]?.toLowerCase());
        expect(values.every(Boolean), `${palette} ${theme} に色の無い役が在る`).toBe(true);
        expect(new Set(values).size, `${palette} ${theme} の記法の役の色が重なる: ${values.join(" ")}`).toBe(NOTATION_ROLES.length);
      }
    }
  });

  it("syntax-json-roles", async () => {
    const { paintJson } = await highlight();
    const spans = paintJson('{\n  "kind": "sequence",\n  "steps": 3,\n  "open": true,\n  "gone": null\n}').flat();
    const roleOf = (text: string): string | undefined => spans.find((s) => s.text === text)?.role;
    expect(roleOf('"kind"')).toBe("json-key");
    expect(roleOf('"sequence"')).toBe("json-string");
    expect(roleOf("3")).toBe("json-number");
    expect(roleOf("true")).toBe("json-literal");
    expect(roleOf("null")).toBe("json-literal");
    expect(roleOf("{")).toBe("json-punct");
    for (const palette of PALETTE_NAMES) {
      for (const theme of THEMES) {
        const colors = colorsOf(palette, theme);
        const three = ["json-key", "json-string", "json-number"].map((role) => colors[role]?.toLowerCase());
        expect(new Set(three).size, `${palette} ${theme} の JSON の鍵と字の列と数の色が重なる: ${three.join(" ")}`).toBe(3);
      }
    }
    act(() => host.querySelector<HTMLButtonElement>('[data-playground="tab-json"]')?.click());
    expect(spansOf("json-key").length, "JSON の欄の色の層に鍵が無い").toBeGreaterThan(0);
    act(() => host.querySelector<HTMLButtonElement>('[data-playground="tab-notation"]')?.click());
  });

  it("syntax-words-from-reader", async () => {
    const { paintNotation } = await highlight();
    const words = readerWords();
    expect(words.heads.length).toBeGreaterThan(20);
    for (const kind of words.kinds) {
      const [first] = paintNotation(`${kind} 題`, words);
      expect(first?.[0], `図の種類の名前 ${kind} が種類の役にならない`).toEqual({ text: kind, role: "kind" });
    }
    for (const head of words.heads) {
      const lines = paintNotation(`sequence 題\n${head} x`, words);
      expect(lines[1]?.[0], `行の頭の語 ${head} が頭の語の役にならない`).toEqual({ text: head, role: "head" });
    }
    // 色付けの code は語の一覧を持たない。行の頭の語のうち、続く字の読み方が違う 2 つ (命令の行と本文の行) だけを名指す
    const named = new Set(["code", "say"]);
    const source = readFileSync(join(REPO, "apps/playground-spa/src/editor/highlight.ts"), "utf8");
    const literals = new Set([...source.matchAll(/["'`]([a-z]+)["'`]/gu)].map((m) => m[1]));
    const held = [...words.heads, ...words.kinds].filter((word) => !named.has(word) && literals.has(word));
    expect(held, "色付けの code が語の一覧の字を持つ").toEqual([]);
  });

  it("syntax-paint-keeps-text", async () => {
    const { paintNotation, paintJson } = await highlight();
    const words = readerWords();
    const dir = join(REPO, "packages/dragon/examples");
    const files = readdirSync(dir).filter((name) => name.endsWith(".dragon"));
    expect(files.length).toBeGreaterThan(40);
    const joined = (lines: Span[][]): string => lines.map((line) => line.map((s) => s.text).join("")).join("\n");
    for (const name of files) {
      const text = readFileSync(join(dir, name), "utf8");
      expect(joined(paintNotation(text, words)), `${name} の記法の色の層の字が書く欄と違う`).toBe(text);
      const read = dragon.parseNotation(text);
      if (!read.ok) continue;
      const json = JSON.stringify(read.diagram, null, 2);
      expect(joined(paintJson(json)), `${name} の JSON の色の層の字が書く欄と違う`).toBe(json);
    }
  });

  it("syntax-paint-follows-typing-and-scroll", () => {
    type(SAMPLE);
    expect(paint()?.textContent).toBe(area().value);
    type(`${SAMPLE}\n  b -> a: 返す`);
    expect(paint()?.textContent, "打った後の色の層の字が書く欄と違う").toBe(area().value);
    expect(paint()?.getAttribute("aria-hidden"), "色の層が読み上げに出る").toBe("true");
    act(() => {
      area().scrollTop = 40;
      area().scrollLeft = 12;
      area().dispatchEvent(new Event("scroll"));
    });
    expect(paint()?.scrollTop, "色の層が書く欄と同じ量だけ縦に送られない").toBe(area().scrollTop);
    expect(paint()?.scrollLeft, "色の層が書く欄と同じ量だけ横に送られない").toBe(area().scrollLeft);
  });

  it("syntax-paint-steps-aside-while-composing", () => {
    const body = (): HTMLElement | null => host.querySelector<HTMLElement>(".pg-code-body");
    act(() => {
      area().dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    });
    expect(body()?.dataset.composing, "字を組んでいる間に書く欄の字を見せない").toBe("true");
    act(() => {
      area().dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    });
    expect(body()?.dataset.composing, "字を組み終えても色の層に戻らない").toBeUndefined();
  });

  it("syntax-colors-readable", () => {
    for (const palette of PALETTE_NAMES) {
      for (const theme of THEMES) {
        const colors = colorsOf(palette, theme);
        const ground = dragon.resolvePalette(palette)[theme].sunk ?? "";
        for (const role of [...NOTATION_ROLES, ...JSON_ROLES]) {
          const color = colors[role] ?? "";
          expect(contrast(color || "#888888", ground), `${palette} ${theme} の ${role} (${color}) と地 (${ground}) の濃さの比`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("editor-shelf-part-inserts-lines", async () => {
    type(SAMPLE);
    act(() => host.querySelector<HTMLButtonElement>('[data-playground="shelf-tab-parts"]')?.click());
    await until(() => host.querySelector('[data-playground^="part-"]') !== null, "棚の部品");
    const before = area().value;
    act(() => host.querySelector<HTMLButtonElement>('[data-playground^="part-"]')?.click());
    expect(area().value.length, "棚の部品を押しても書く欄に行が足されない").toBeGreaterThan(before.length);
  });

  it("editor-notice-line-selects-line", async () => {
    type(`${SAMPLE}\n  a -> nowhere: 届かない`);
    await until(() => host.querySelector('[data-playground="notice-line"]') !== null, "知らせの欄の行番号");
    const button = host.querySelector<HTMLButtonElement>('[data-playground="notice-line"]');
    const line = Number(/\d+/u.exec(button?.textContent ?? "")?.[0] ?? 0);
    expect(line, "知らせの欄の行番号が読めない").toBeGreaterThan(0);
    act(() => button?.click());
    const lines = area().value.split("\n");
    const start = lines.slice(0, line - 1).reduce((n, l) => n + l.length + 1, 0);
    expect(area().selectionStart, `知らせの ${line} 行目を押しても、その行が選ばれない`).toBe(start);
    expect(area().selectionEnd).toBe(start + (lines[line - 1]?.length ?? 0));
  });
});
