/**
 * dragon記法の誤りの文の言葉と、使い方の文書の英語版 (#2997、#3137)。
 *
 * 記法の語は英語だけで、file から言葉は決まらない。
 * 誤りの文は呼ぶ側が渡した言葉で出し、渡さなければ英語で出す (#3338)。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, exampleText, type LineError, type Parsed } from "./diagram-support";

/** 仮名と漢字。英語の誤りの文に入らない */
const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

const firstError = (parsed: Parsed): LineError | undefined => (parsed.ok ? undefined : parsed.errors[0]);

describe("誤りの文の言葉", () => {
  const base = ["sequence Errors", "box app as App", "box api as API", "step Call", "  say App calls API.", "  app -> api: call"];
  const replace = (index: number, line: string): string => base.map((l, i) => (i === index ? line : l)).join("\n");
  const insert = (index: number, line: string): string => [...base.slice(0, index), line, ...base.slice(index)].join("\n");

  /** 誤りの形ごとの記法。どの形も 1 つ目の誤りで止まる */
  const cases: Record<string, string> = {
    宣言していない箱: replace(5, "  app -> nowhere: lost"),
    知らない行の頭: replace(5, "  app => api"),
    本文の無い段: [...base, "step Again"].join("\n"),
    色の値: replace(1, "box app as App [color: pink]"),
    名札の重なり: insert(3, "box app as Again"),
    見せ方の値: replace(0, "sequence Errors [view: sideways]"),
    宣言していない帯: replace(5, "  set phase: ready"),
    知らない属性の鍵: replace(1, "box app as App [shape: round]"),
    コロンの無い属性: replace(1, "box app as App [color blue]"),
    閉じていない区画: insert(1, "group zone"),
    箱が無い: ["sequence Empty", "step Call", "  say Nothing."].join("\n"),
    段が無い: ["sequence Only", "box app"].join("\n"),
    題の無い段: insert(3, "step"),
    題の無い図: ["sequence", "box app"].join("\n"),
    前の形の図の種類: replace(0, "時系列図 Errors"),
    読めない最初の行: "flow chart",
    空の記法: "",
  };

  it("errors-follow-given-language", () => {
    const parse = api("parseNotation");
    for (const [label, text] of Object.entries(cases)) {
      const fallback = firstError(parse(text));
      const ja = firstError(parse(text, { lang: "ja" }));
      const en = firstError(parse(text, { lang: "en" }));
      expect(ja, `${label} が誤りにならない`).toBeDefined();
      expect(ja?.line, label).toBeGreaterThan(0);
      expect(ja?.column, label).toBeGreaterThan(0);
      // ja を渡した時は日本語で出す
      expect(ja?.message, `${label} の誤りの文が日本語でない`).toMatch(KANA_KANJI);
      // 渡さない時は既定の英語で出し、en を渡した時と同じ文になる (#3338)
      expect(fallback, `${label} に言葉を渡さない時の誤りが、en を渡した時と違う`).toEqual(en);
      // en を渡した時は、同じ場所を英語の文で示す
      expect(en, `${label} に en を渡した時の誤りが無い`).toMatchObject({ line: ja?.line, column: ja?.column });
      expect(en?.message, `${label} に en を渡した時の誤りの文が空`).not.toBe("");
      // 前の形の語を名指す文は、その語だけを除いて確かめる
      const shown = (en?.message ?? "").replaceAll("時系列図", "");
      expect(shown, `${label} に en を渡した時の誤りの文が英語でない`).not.toMatch(KANA_KANJI);
    }
    expect(firstError(parse(cases.宣言していない箱 ?? ""))).toMatchObject({ line: 6, column: 10 });
    expect(firstError(parse(cases.宣言していない箱 ?? ""))?.message).toContain("nowhere");
  });
});

describe("使い方の文書", () => {
  it("quick-start-en-fences-parse", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const path = join(process.cwd(), "packages/dragon/examples/quick-start.en.md");
    expect(existsSync(path), "使い方の文書の英語版 (packages/dragon/examples/quick-start.en.md) が無い").toBe(true);
    if (!existsSync(path)) return;
    const english = extract(readFileSync(path, "utf8"));
    const japanese = extract(exampleText("quick-start.md"));
    expect(english.length, "英語版の図の数が日本語版と違う").toBeGreaterThan(0);
    expect(english.length, "英語版の図の数が日本語版と違う").toBe(japanese.length);
    for (const fence of [...english, ...japanese]) {
      const parsed = parse(fence.source);
      expect(parsed.ok, `${fence.line} 行目の囲みが読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
    }
  });

  it("quick-start-covers-state", () => {
    // 書き方の手引きは書き方の全部を名乗るので、状態遷移図 (#3163) の行の形と例も載せる (#3172)
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    for (const [file, heading] of [
      ["quick-start.md", "行の形"],
      ["quick-start.en.md", "Line forms"],
    ] as const) {
      const text = exampleText(file);
      const forms = text.split(new RegExp(`^## ${heading}$`, "mu"))[1]?.split(/^## /mu)[0] ?? "";
      expect(forms, `${file} に ## ${heading} の節が無い`).not.toBe("");
      expect(/(^|[^A-Za-z-])state($|[^A-Za-z-])/mu.test(forms), `${file} の ${heading} の節に state の行が無い`).toBe(true);
      const states = extract(text).filter((fence) => fence.source.trimStart().startsWith("state "));
      expect(states.length, `${file} に state で始まる例が無い`).toBeGreaterThan(0);
      for (const fence of states) {
        const parsed = parse(fence.source);
        expect(parsed.ok, `${file} の ${fence.line} 行目の state の例が読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
      }
    }
  });

  it("quick-start-covers-git", () => {
    // 書き方の手引きは書き方の全部を名乗るので、枝分かれの図 (#3164) の行の形と例も載せる (#3202)
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    for (const [file, heading] of [
      ["quick-start.md", "行の形"],
      ["quick-start.en.md", "Line forms"],
    ] as const) {
      const text = exampleText(file);
      const forms = text.split(new RegExp(`^## ${heading}$`, "mu"))[1]?.split(/^## /mu)[0] ?? "";
      expect(forms, `${file} に ## ${heading} の節が無い`).not.toBe("");
      for (const word of ["git", "branch", "commit"]) {
        expect(new RegExp(`(^|[^A-Za-z-])${word}($|[^A-Za-z-])`, "mu").test(forms), `${file} の ${heading} の節に ${word} の行が無い`).toBe(true);
      }
      const graphs = extract(text).filter((fence) => fence.source.trimStart().startsWith("git "));
      expect(graphs.length, `${file} に git で始まる例が無い`).toBeGreaterThan(0);
      for (const fence of graphs) {
        const parsed = parse(fence.source);
        expect(parsed.ok, `${file} の ${fence.line} 行目の git の例が読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
      }
    }
  });

  it("quick-start-covers-time", () => {
    // 書き方の手引きは書き方の全部を名乗るので、時間軸の図 (#3165) の行の形と例も載せる (#3221)
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    for (const [file, heading] of [
      ["quick-start.md", "行の形"],
      ["quick-start.en.md", "Line forms"],
    ] as const) {
      const text = exampleText(file);
      const forms = text.split(new RegExp(`^## ${heading}$`, "mu"))[1]?.split(/^## /mu)[0] ?? "";
      expect(forms, `${file} に ## ${heading} の節が無い`).not.toBe("");
      for (const word of ["time", "scale", "period", "row", "point", "zoom", "mark", "span"]) {
        expect(new RegExp(`(^|[^A-Za-z-])${word}($|[^A-Za-z-])`, "mu").test(forms), `${file} の ${heading} の節に ${word} の行が無い`).toBe(true);
      }
      const examples = extract(text).filter((fence) => fence.source.trimStart().startsWith("time "));
      expect(examples.length, `${file} に time で始まる例が無い`).toBeGreaterThan(0);
      for (const fence of examples) {
        const parsed = parse(fence.source);
        expect(parsed.ok, `${file} の ${fence.line} 行目の time の例が読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
      }
    }
  });

  it("quick-start-covers-tree", () => {
    // 書き方の手引きは書き方の全部を名乗るので、木の図 (#3233) の行の形と例も載せる (#3235)
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    for (const [file, heading] of [
      ["quick-start.md", "行の形"],
      ["quick-start.en.md", "Line forms"],
    ] as const) {
      const text = exampleText(file);
      const forms = text.split(new RegExp(`^## ${heading}$`, "mu"))[1]?.split(/^## /mu)[0] ?? "";
      expect(forms, `${file} に ## ${heading} の節が無い`).not.toBe("");
      for (const word of ["tree", "leaf", "node"]) {
        expect(new RegExp(`(^|[^A-Za-z-])${word}($|[^A-Za-z-])`, "mu").test(forms), `${file} の ${heading} の節に ${word} の行が無い`).toBe(true);
      }
      const examples = extract(text).filter((fence) => fence.source.trimStart().startsWith("tree "));
      expect(examples.length, `${file} に tree で始まる例が無い`).toBeGreaterThan(0);
      for (const fence of examples) {
        const parsed = parse(fence.source);
        expect(parsed.ok, `${file} の ${fence.line} 行目の tree の例が読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
      }
    }
  });
});

describe("既定の言葉 (#3338)", () => {
  it("default-lang-lives-in-one-place", () => {
    // 既定の言葉は words.ts の DEFAULT_LANG だけが持つ。各所に "ja" か "en" を書くと、変える時に直し漏れる
    const src = join(__dirname, "../src");
    const files = readdirSync(src, { recursive: true, encoding: "utf8" }).filter((file) => /\.tsx?$/u.test(file));
    expect(files.length, "packages/dragon/src に .ts が無い").toBeGreaterThan(0);
    // 既定に倒す 3 つの書き方 (`?? "ja"`、引数の既定 `lang: NotationLang = "ja"`、`? lang : "ja"]`)。DEFAULT_LANG の宣言そのものは除く
    const literal = /\?\? "(?:ja|en)"|\w+: NotationLang = "(?:ja|en)"|\? \w+ : "(?:ja|en)"\]/u;
    const declaration = 'export const DEFAULT_LANG: NotationLang = "en";';
    const found = files.flatMap((file) =>
      readFileSync(join(src, file), "utf8")
        .split("\n")
        .map((line, i) => ({ where: `${file}:${i + 1}`, line }))
        .filter(({ line }) => literal.test(line) && line.trim() !== declaration)
        .map(({ where, line }) => `${where} ${line.trim()}`),
    );
    expect(found, "言葉の既定を DEFAULT_LANG を通さずに書いた行").toEqual([]);
    expect(readFileSync(join(src, "words.ts"), "utf8"), "words.ts の既定が英語でない").toContain(declaration);
  });
});
