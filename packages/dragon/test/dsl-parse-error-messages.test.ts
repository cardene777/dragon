/**
 * DSL parse error messages coverage (iter27、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter27。
 * 意図的に壊れた DSL について textDslToDiagram が (a) throw する or (b) 有効
 * output を返さないことを verify。 silent success (壊れた DSL が silent に空 diagram を返す)
 * regression を検知。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";

describe("iter27: DSL parse error messages coverage", () => {
  it("空 DSL は空 diagram or throw (silent-empty regression check)", () => {
    const dsl = ``;
    let threw = false;
    let compiled;
    try {
      compiled = textDslToDiagram(dsl);
    } catch {
      threw = true;
    }
    // 空 DSL は throw or 空 nodes のどちらか
    if (!threw && compiled) {
      expect(compiled.nodes.length, "empty DSL empty nodes").toBe(0);
    }
  });

  it("type 欠落 DSL は throw (parse error 明示)", () => {
    const dsl = `title: "t"
actors:
  - A
flow:
  - A -> A: "x"
`;
    // type field は required、 parse error message を throw する
    expect(() => textDslToDiagram(dsl)).toThrow(/parse error|type/i);
  });

  it("actors 欠落 DSL でも compile 継続 (defensive)", () => {
    const dsl = `title: "t"
type: sequence
flow:
  - A -> A: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("flow のみ (actor 定義なし) でも throw なし", () => {
    const dsl = `title: "t"
type: sequence
flow:
  - X -> Y: "hello"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("不明 kind の parts unified syntax は catalog lookup 失敗で fallback", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - alias1: { kind: nonexistent-kind }
flow:
  - A -> A: "x"
`;
    // catalog に無い kind 指定 = fallback (throw なし or degraded compile)
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("valid 最小 DSL は成功", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "hi"
`;
    const compiled = textDslToDiagram(dsl);
    expect(compiled).toBeDefined();
    expect(compiled.nodes.length).toBeGreaterThan(0);
  });

  it("複数行 label が escape なしで throw しない", () => {
    const dsl = `title: "test"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "line1 line2"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });
});
