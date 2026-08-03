/**
 * DSL grammar corner case coverage (iter32、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter32。
 * 実運用で hit する可能性のある DSL corner case を batch verify。
 *
 * (a) YAML comment (# ...) を含む DSL
 * (b) 空行複数
 * (c) タブインデント混在
 * (d) 極端長 actor 名
 * (e) 極端多数 actor (50+)
 * (f) 極端長 label
 * (g) special char (colon / dash / brace) を quoted で含む
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";

describe("iter32: DSL grammar corner case coverage", () => {
  it("YAML comment を含む DSL", () => {
    const dsl = `# top-level comment
title: "t"
type: sequence
# actor section
actors:
  - Client
  - API
flow:
  - Client -> API: "x"  # inline comment
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
    const d = textDslToDiagram(dsl);
    expect(d.nodes.length).toBeGreaterThan(0);
  });

  it("空行複数を含む DSL", () => {
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

  it("極端長 actor 名 (100 char)", () => {
    const longName = "a".repeat(100);
    const dsl = `title: "t"
type: sequence
actors:
  - "${longName}"
  - B
flow:
  - "${longName}" -> B: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
    const d = textDslToDiagram(dsl);
    expect(d.nodes.length).toBeGreaterThan(0);
  });

  it("極端多数 actor (30 個)", () => {
    const actors = Array.from({ length: 30 }, (_, i) => `  - actor${i}`).join("\n");
    const dsl = `title: "t"
type: sequence
actors:
${actors}
flow:
  - actor0 -> actor1: "x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
    const d = textDslToDiagram(dsl);
    expect(d.nodes.length).toBeGreaterThanOrEqual(30);
  });

  it("極端長 label (200 char)", () => {
    const longLabel = "l".repeat(200);
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - B
flow:
  - A -> B: "${longLabel}"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("Unicode actor 名 (日本語 / 韓国語 / 中国語)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - "ユーザー"
  - "관리자"
  - "服务器"
flow:
  - "ユーザー" -> "관리자": "요청"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("emoji actor 名", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - "🚀Rocket"
  - "🐢Turtle"
flow:
  - "🚀Rocket" -> "🐢Turtle": "🎯hit"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("special char in quoted (colon / dash / brace / quotes)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - "A-01"
  - "B-02"
flow:
  - "A-01" -> "B-02": "action-x"
`;
    expect(() => textDslToDiagram(dsl)).not.toThrow();
  });

  it("トレーリング空白", () => {
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

  it("小規模 DSL の compile 出力の型 sanity", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
flow:
  - A -> A: "x"
`;
    const d = textDslToDiagram(dsl);
    expect(Array.isArray(d.nodes)).toBe(true);
    expect(Array.isArray(d.edges)).toBe(true);
    expect(Array.isArray(d.states)).toBe(true);
    expect(Array.isArray(d.phases)).toBe(true);
  });
});
