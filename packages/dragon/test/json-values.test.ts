/**
 * JSON の入口が `states` / `values` を受けることの検査 (#1181)。
 *
 * 記法 (`textDslToDiagram`) は値を図に載せるようになったが、JSON の入口
 * (`jsonToDiagram`) は受ける場所そのものが無く、書いても黙って消えていた。 同じ機能の
 * 別入口だけが穴として残る形になっていた。
 *
 * **記法と同じ実経路を通す**。 値が届いたかは `layout()` → `computeStateValues` で見る
 * (`#1162` で決めた書き方)。 図の `derived` に載ったことだけを見ると、`diagram.states` が
 * 空でも通ってしまう。
 */
import { describe, it, expect } from "vitest";
import { computeStateValues, layout } from "@cardenelabs/cdl";
import { jsonToDiagram, validateDragonJson, diagramJsonSchema, textDslToDiagram } from "../src/index";

/** JSON の最小形。 `states` / `values` だけを差し替えて使う */
const 図 = (extra: Record<string, unknown>) => ({
  title: "確認",
  type: "flow",
  actors: [{ name: "受付", value: "{waiting}" }, { name: "処理" }],
  flow: [{ from: "受付", to: "処理", label: "渡す" }],
  ...extra,
});

/** その瞬間に描画側が読む値。 記法側の検査と同じ経路を通す */
function 描画が読む値(json: unknown, 段 = 0, 進み = 0): Record<string, string> {
  return computeStateValues(layout(jsonToDiagram(json)), 段, 進み);
}

/** 誤りの一覧 (path 付き) */
function 誤り(json: unknown): string[] {
  const r = validateDragonJson(json);
  return r.ok ? [] : r.errors.map((e) => `${e.path}: ${e.message}`);
}

describe("JSON に書いた値が図に届く (#1181)", () => {
  it("`values` が図に載る", () => {
    const d = jsonToDiagram(
      図({ states: { inflow: 10, done: 4 }, values: { waiting: "{inflow} - {done}" } }),
    );
    expect(d.derived).toEqual([{ id: "waiting", expression: "{inflow} - {done}" }]);
  });

  it("`states` が図に載る", () => {
    const d = jsonToDiagram(図({ states: { inflow: 10, done: 4 } }));
    expect(d.states).toEqual([
      { id: "inflow", initial: 10 },
      { id: "done", initial: 4 },
    ]);
  });

  it("段を書かなくても、描画側が読む値に届く", () => {
    // 記法側と同じ形 (`#1162`)。 `animation` を書かない JSON でも値が組み立てられる
    const v = 描画が読む値(
      図({ states: { inflow: 10, done: 4 }, values: { waiting: "{inflow} - {done}" } }),
    );
    expect(v.inflow).toBe("10");
    expect(v.waiting).toBe("6");
  });

  it("段を書いた JSON でも届く", () => {
    const v = 描画が読む値(
      図({
        states: { inflow: 100, done: 30 },
        values: { waiting: "{inflow} - {done}", busy: "{waiting} > 50" },
        animation: [{ step: "流れる", focus: ["受付"] }],
      }),
    );
    expect(v.waiting).toBe("70");
    expect(v.busy).toBe("1");
  });

  it("文字列の初期値も届く", () => {
    const v = 描画が読む値(図({ states: { label: "受付中" } }));
    expect(v.label).toBe("受付中");
  });

  it("`states` / `values` を書かない JSON の挙動が変わらない", () => {
    const d = jsonToDiagram(図({}));
    expect(d.states).toEqual([]);
    expect(d.derived).toBeUndefined();
  });
});

describe("記法と JSON が同じ結果になる (#1181)", () => {
  it("同じ内容を両方の入口で書くと、図に載る値が一致する", () => {
    // 入口ごとに結果が違うと、書き手は「どちらが正しいか」 を判断できない
    const json = jsonToDiagram(
      図({ states: { inflow: 10, done: 4 }, values: { waiting: "{inflow} - {done}" } }),
    );
    const 記法 = textDslToDiagram(`title: "確認"
type: flow

actors:
  - 受付: "{waiting}"
  - 処理

flow:
  - 受付 -> 処理: "渡す"

states:
  inflow: 10
  done: 4

values:
  waiting: "{inflow} - {done}"
`);
    expect(json.derived).toEqual(記法.derived);
    expect(json.states).toEqual(記法.states);
    expect(computeStateValues(layout(json), 0, 0)).toEqual(computeStateValues(layout(記法), 0, 0));
  });
});

describe("JSON の値の誤りを伝える (#1181)", () => {
  it("名前の規則を外れた値を弾く", () => {
    // 描画側が `{名前}` を置き換える時に見るのも同じ範囲。 通すと「書いたのに置き換わらない」
    const e = 誤り(図({ values: { "待ち": "{inflow} - 1" } }));
    expect(e.join("\n")).toContain("$.values.待ち");
    expect(e.join("\n")).toContain("invalid value name");
  });

  it("名前の規則を外れた状態を弾く", () => {
    const e = 誤り(図({ states: { "流入": 1 } }));
    expect(e.join("\n")).toContain("$.states.流入");
  });

  it("記法で書けない式を、JSON でも同じ理由で弾く", () => {
    // **判定を共有していることの検査** (`value-syntax.ts`)。 別々に持つと、YAML では弾かれる
    // 式が JSON では通る形ができる
    for (const [式, 含む] of [
      ["{a} % 2", "%"],
      ["Math.floor({a})", "Math."],
      ["{a} > 1 ? 2 : 3", "条件分岐"],
    ] as const) {
      const e = 誤り(図({ values: { a2: 式 } }));
      expect(e.join("\n"), `${式} が通っている`).toContain(含む);
    }
  });

  it("式が文字列でない / 空なら弾く", () => {
    expect(誤り(図({ values: { a: 1 } })).join("\n")).toContain("non-empty string");
    expect(誤り(図({ values: { a: "  " } })).join("\n")).toContain("non-empty string");
  });

  it("状態の初期値が数でも文字列でもなければ弾く", () => {
    expect(誤り(図({ states: { a: true } })).join("\n")).toContain("number or string");
    expect(誤り(図({ states: { a: Number.POSITIVE_INFINITY } })).join("\n")).toContain("finite");
  });

  it("object でない `states` / `values` を弾く", () => {
    expect(誤り(図({ states: [] })).join("\n")).toContain("$.states");
    expect(誤り(図({ values: "x" })).join("\n")).toContain("$.values");
  });

  it("弾いた JSON は組み立てない", () => {
    expect(() => jsonToDiagram(図({ values: { "待ち": "{a}" } }))).toThrow(/invalid value name/);
  });
});

describe("schema と受理する形が一致する (#1181)", () => {
  it("schema に `states` / `values` がある", () => {
    // schema は LLM に渡す契約。 受けられるのに書いていないと、LLM は書く手段を知らない
    const props = diagramJsonSchema.properties as Record<string, unknown>;
    expect(Object.keys(props)).toContain("states");
    expect(Object.keys(props)).toContain("values");
  });

  it("schema が名前の規則を持つ", () => {
    // 規則を書かないと、LLM が日本語の名前を出して組み立てで弾かれる往復が起きる
    const props = diagramJsonSchema.properties as Record<string, { patternProperties?: Record<string, unknown> }>;
    for (const key of ["states", "values"]) {
      const pattern = Object.keys(props[key]?.patternProperties ?? {});
      expect(pattern, `${key} に名前の規則が無い`).toEqual(["^[a-zA-Z_][a-zA-Z0-9_]*$"]);
    }
  });

  it("schema の例がそのまま組み立てを通る", () => {
    // 例が古いと、LLM は schema の例を真似て弾かれる
    const props = diagramJsonSchema.properties as Record<string, { examples?: unknown[] }>;
    const states = props.states?.examples?.[0] as Record<string, number>;
    const values = props.values?.examples?.[0] as Record<string, string>;
    expect(() => jsonToDiagram(図({ states, values }))).not.toThrow();
  });
});
