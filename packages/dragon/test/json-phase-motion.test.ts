/**
 * JSON の段が `tween` / `set` を受けることの検査 (#1186)。
 *
 * `#1181` で JSON の入口が `states` を受けるようになったが、**動かす手段が無かった**。
 * 初期値は書けるのに段で変える方法が無いため、同じ図を記法で書くと動き JSON で書くと静止する
 * 状態だった。 同じ機能の別入口だけが穴として残る形は `#1181` と同じ。
 *
 * **記法と同じ実経路を通す**。 値が届いたかは `layout()` → `computeStateValues` で見る
 * (`#1162` / `#1181` で決めた書き方)。 図の `phases` に載ったことだけを見ると、描画側が
 * 読めない形でも通ってしまう。
 */
import { describe, it, expect } from "vitest";
import { computeStateValues, layout } from "@cardenelabs/cdl";
import { jsonToDiagram, validateDragonJson, diagramJsonSchema, textDslToDiagram } from "../src/index";

/** JSON の最小形。 `states` / `animation` だけを差し替えて使う */
const 図 = (extra: Record<string, unknown>) => ({
  title: "確認",
  type: "flow",
  actors: [{ name: "受付", value: "{amount}" }, { name: "処理" }],
  flow: [{ from: "受付", to: "処理", label: "渡す" }],
  ...extra,
});

/**
 * 段の途中の値を取る。 `t` は 0-1 の進み具合。
 *
 * `computeStateValues` は描画側で `{名前}` に差し込む用途なので **文字列で返る**。
 * 数として比べたい所は呼び側で直す (`json-values.test.ts` は object ごと比べているため
 * この違いが表に出ない)。
 */
const 段の値 = (d: ReturnType<typeof jsonToDiagram>, 段: number, t: number) => {
  const laid = layout(d);
  return computeStateValues(laid, 段, t);
};

/** 段の途中の値を数として取る */
const 段の数 = (d: ReturnType<typeof jsonToDiagram>, 段: number, t: number, 名: string) =>
  Number(段の値(d, 段, t)[名]);

describe("JSON の段で値を動かせる (#1186)", () => {
  it("tween が段の途中の値になる", () => {
    const d = jsonToDiagram(
      図({
        states: { amount: 0 },
        animation: [{ step: "読込", tween: { amount: [0, 100] } }],
      }),
    );
    // 段の中間で補間される。 端だけを見ると `set` との区別が付かない
    expect(段の数(d, 0, 0, "amount")).toBe(0);
    expect(段の数(d, 0, 0.5, "amount")).toBe(50);
    expect(段の数(d, 0, 1, "amount")).toBe(100);
  });

  it("set が段の切替で値を変える", () => {
    const d = jsonToDiagram(
      図({
        states: { amount: 0, phase: "init" },
        animation: [
          { step: "開始", set: { phase: "loading" } },
          { step: "完了", set: { phase: "done" } },
        ],
      }),
    );
    expect(段の値(d, 0, 1).phase).toBe("loading");
    expect(段の値(d, 1, 1).phase).toBe("done");
  });

  it("同じ内容を記法と JSON で書くと結果が一致する", () => {
    // 入口が 2 つある機能は、片方だけが動く状態を作らないことが要点 (#1181 と同じ)
    const j = jsonToDiagram(
      図({
        states: { amount: 0 },
        animation: [{ step: "読込", duration: 2, tween: { amount: [0, 100] } }],
      }),
    );
    const y = textDslToDiagram(`title: "確認"
type: flow
actors:
  - 受付: { value: "{amount}" }
  - 処理
flow:
  - 受付 -> 処理: "渡す"
states:
  amount: 0
animation:
  - step: "読込" 2.0s
    tween: amount 0 -> 100
`);
    for (const t of [0, 0.25, 0.5, 1]) {
      expect(段の数(j, 0, t, "amount"), `t=${t} で一致しない`).toBe(段の数(y, 0, t, "amount"));
    }
  });

  it("実在しない状態名を指した tween を誤りとして伝える", () => {
    // 黙って捨てると「書いたのに動かない」 が手掛かりなしで起きる
    const r = validateDragonJson(
      図({ states: { amount: 0 }, animation: [{ step: "読込", tween: { 無い名前: [0, 1] } }] }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("unknown state"))).toBe(true);
  });

  it("実在しない状態名を指した set を誤りとして伝える", () => {
    const r = validateDragonJson(
      図({ states: { amount: 0 }, animation: [{ step: "読込", set: { 無い名前: 1 } }] }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("unknown state"))).toBe(true);
  });

  it("tween に数でない値を書くと誤りとして伝える", () => {
    // 補間は数どうしでしか成り立たない。 文字列を通すと段の途中が壊れる
    const r = validateDragonJson(
      図({ states: { amount: 0 }, animation: [{ step: "読込", tween: { amount: ["a", "b"] } }] }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("finite numbers"))).toBe(true);
  });

  it("tween の組が 2 つでないと誤りとして伝える", () => {
    const r = validateDragonJson(
      図({ states: { amount: 0 }, animation: [{ step: "読込", tween: { amount: [0] } }] }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("[from, to]"))).toBe(true);
  });

  it("正しい tween / set は通る", () => {
    // 誤りを弾く検査だけだと「全部弾く」 実装でも通るため、通る側も固定する
    const r = validateDragonJson(
      図({
        states: { amount: 0, phase: "init" },
        animation: [{ step: "読込", tween: { amount: [0, 100] }, set: { phase: "loading" } }],
      }),
    );
    expect(r.ok, r.ok ? "" : r.errors.map((e) => `${e.path}: ${e.message}`).join(" / ")).toBe(true);
  });

  it("schema が tween / set を含む", () => {
    // `additionalProperties: false` があるため、schema に無いと LLM 側で弾かれる
    const phase = (diagramJsonSchema as Record<string, any>).properties.animation.items.properties;
    expect(Object.keys(phase)).toEqual(expect.arrayContaining(["tween", "set"]));
  });
});
