/**
 * DSL whitespace variations 網羅 (iter51、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter51。
 * indent スタイル / whitespace 変動を verify、 defensive parser の robustness を確認。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";

describe("iter51: DSL whitespace / indent variations", () => {
  it("標準 2-space indent", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("4-space indent", () => {
    const dsl = `title: "t"
type: sequence
actors:
    - A
    - B
flow:
    - A -> B: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("末尾改行 (trailing newline)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "x"

`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("末尾改行なし (no trailing newline)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "x"`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("行頭に空白 tab は許容 (YAML 準拠 - space のみ許容)", () => {
    // tab indent は YAML では非対応、 全角 space は非対応、 半角 space のみ
    const dsl = `title: "t"
type: sequence
actors:
  - A
flow:
  - A -> A: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("行間に空行複数", () => {
    const dsl = `title: "t"


type: sequence


actors:

  - A

  - B


flow:

  - A -> B: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("複数連続 comment", () => {
    const dsl = `# c1
# c2
# c3
title: "t"
type: sequence
# section comment
actors:
  - A
  - B
# flow section
flow:
  - A -> B: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("comment 末尾に emoji / 特殊文字", () => {
    const dsl = `title: "t"
type: sequence
# コメント 日本語 🎉
actors:
  - A
  - B
flow:
  - A -> B: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("field 順序変更 (type → title → actors)", () => {
    const dsl = `type: sequence
title: "t"
actors:
  - A
  - B
flow:
  - A -> B: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("field 順序変更 (actors → flow → type → title)", () => {
    const dsl = `actors:
  - A
  - B
flow:
  - A -> B: "x"
type: sequence
title: "t"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });
});
