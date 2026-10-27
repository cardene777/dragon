/**
 * dragon記法の誤りの文の言葉と、使い方の文書の英語版 (#2997、#3137)。
 *
 * 記法の語は英語だけで、file から言葉は決まらない。
 * 誤りの文は呼ぶ側が渡した言葉で出し、渡さなければ日本語で出す。
 */
import { existsSync, readFileSync } from "node:fs";
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
    今の形の図の種類: replace(0, "時系列図 Errors"),
    読めない最初の行: "flow chart",
    空の記法: "",
  };

  it("errors-follow-given-language", () => {
    const parse = api("parseNotation");
    for (const [label, text] of Object.entries(cases)) {
      const ja = firstError(parse(text));
      const given = firstError(parse(text, { lang: "ja" }));
      const en = firstError(parse(text, { lang: "en" }));
      expect(ja, `${label} が誤りにならない`).toBeDefined();
      expect(ja?.line, label).toBeGreaterThan(0);
      expect(ja?.column, label).toBeGreaterThan(0);
      // 渡さない時は日本語で出し、ja を渡した時と同じ文になる
      expect(ja?.message, `${label} の誤りの文が日本語でない`).toMatch(KANA_KANJI);
      expect(given, `${label} に ja を渡した時の誤りが、渡さない時と違う`).toEqual(ja);
      // en を渡した時は、同じ場所を英語の文で示す
      expect(en, `${label} に en を渡した時の誤りが無い`).toMatchObject({ line: ja?.line, column: ja?.column });
      expect(en?.message, `${label} に en を渡した時の誤りの文が空`).not.toBe("");
      // 今の形の語を名指す文は、その語だけを除いて確かめる
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
});
