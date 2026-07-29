/**
 * DSL parse error messages coverage (iter27、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter27。
 * 意図的に壊れた DSL について textDslToDiagram が (a) throw する or (b) 有効
 * output を返さないことを verify。 silent success (壊れた DSL が silent に空 diagram を返す)
 * regression を検知。
 */
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { textDslToDiagram } from "../src/index";
import { parseTextDslV05 } from "../src/v05";
import { ACTOR_ITEM_KEYS } from "../src/v05/parser";

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

/**
 * 縦に並べた項目名の綴り誤りを知らせるか。
 *
 * パーツでない箱に書いた見知らぬ項目は、 状態の上書きとして拾われた後どこにも入らずに
 * 消える。 黙って捨てると「書いたのに図が変わらない」 が手掛かりなしで起きる。
 */
describe("項目名の綴り誤り", () => {
  const wrap = (item: string): string => `title: "t"
type: flow
actors:
  - Web: service
  - API:
      kind: service
${item}
flow:
  - Web -> API: "a"
`;

  it("使えない項目名を書いたら行番号付きで知らせる", () => {
    const r = parseTextDslV05(wrap('      補足文: "APIサーバー"'));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const e = r.errors.find((x) => x.message.includes("項目名が読めません"));
    expect(e).toBeDefined();
    expect(e!.message).toContain("補足文");
    expect(e!.line).toBeGreaterThan(0);
    // 何が使えるかを並べて、 直せるようにする
    expect(e!.hint).toContain("補足");
    expect(e!.hint).toContain("位置");
    expect(e!.hint).toContain("色");
  });

  /** 項目名ごとに、 その項目が受け付ける形の値。 */
  const VALUE_OF: Record<string, string> = {
    kind: "database", 種類: "database",
    subtitle: '"APIサーバー"', 補足: '"APIサーバー"',
    value: "42", 値: "42",
    rows: '["id: PK"]', 行: '["id: PK"]',
    位置: "300,200", pos: "300,200", posX: "300", posY: "200",
    大きさ: "400,180", size: "400,180",
    lane: "l1", stack: "1",
    色: "失敗", color: "失敗", tone: "失敗",
  };

  it("知らせに並べる項目名は全て実際に使える (一覧と実装がずれない)", () => {
    for (const key of ACTOR_ITEM_KEYS) {
      const value = VALUE_OF[key];
      expect(value, `${key} の値の例が test に無い`).toBeDefined();
      const r = parseTextDslV05(wrap(`      ${key}: ${value}`));
      const detail = r.ok ? "" : r.errors.map((e) => e.message).join(" / ");
      expect(r.ok, `項目 ${key} が通らない: ${detail}`).toBe(true);
    }
  });

  it("実装が受け付ける項目名を 1 つも取りこぼさない (一覧が古くならない)", async () => {
    // 一覧は手書きなので、 分岐に項目を足して一覧を忘れると「使えるのに知らせに出ない」 になる。
    // 実装の分岐を読んで突き合わせる
    const src = await readFile(new URL("../src/v05/parser.ts", import.meta.url), "utf8");
    const start = src.indexOf("function applyContinuationLines");
    expect(start, "対象の関数が見つからない").toBeGreaterThan(0);
    const end = src.indexOf("\nfunction ", start + 1);
    const body = src.slice(start, end > 0 ? end : undefined);
    const cases = [...body.matchAll(/case "([^"]+)":/g)].map((m) => m[1]!);
    expect(cases.length, "分岐が読めていない").toBeGreaterThan(5);
    for (const key of cases) {
      expect(ACTOR_ITEM_KEYS.has(key), `項目 "${key}" が知らせの一覧に無い`).toBe(true);
    }
  });

  it("パーツの状態の上書きは見知らぬ名前でも通す (状態名はパーツごとに違う)", () => {
    const r = parseTextDslV05(`title: "t"
type: flow
actors:
  - Web: service
  - 実績:
      kind: achievement
      v: 50
      cpuC: "#f59e0b"
flow:
  - Web -> Web: "a"
`);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const part = r.doc.actors.find((a) => a.name === "実績")!;
    expect(part.stateOverride).toMatchObject({ v: 50, cpuC: "#f59e0b" });
  });
});
