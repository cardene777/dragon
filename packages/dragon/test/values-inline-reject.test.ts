/**
 * `values:` の 1 行形を黙って捨てないことの検査 (#1169)。
 *
 * `values` は 1 行にまとめて書けない (式に `,` が入るため、`states` が使う素朴な `,` 分割では
 * 式が壊れる)。 その判定が **`{` で始まるかだけ** を見ていたため、`values: a: "{b} + 1"` は
 * 判定を通り抜けた。 その後の読み取りは次行以降しか見ないので、**値が 1 件も読まれずに
 * 黙って消える**。
 *
 * 書き間違いを黙って捨てないという `collectIndentedList` の理由と矛盾していた。
 */
import { describe, it, expect } from "vitest";
import { countDocElements, parseTextDslV05 } from "../src/index";
import type { DslValue } from "../src/index";

const 図 = (values: string) => `title: "確認"
type: flow
actors:
  - 受付
  - 処理
flow:
  - 受付 -> 処理: "渡す"
${values}`;

/** 読めた値の一覧を取る */
const 読めた値 = (src: string): DslValue[] => {
  const r = parseTextDslV05(src);
  return r.ok ? (r.doc.values ?? []) : [];
};

describe("values の 1 行形を黙って捨てない (#1169)", () => {
  it("波括弧で始まる 1 行形を誤りとして伝える", () => {
    const r = parseTextDslV05(図(`values: { waiting: "{a} - {b}" }`));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("1 行にまとめて書けない"))).toBe(true);
  });

  it("波括弧で始まらない 1 行形も誤りとして伝える", () => {
    // ここが本 Issue の主題。 `{` 判定だけでは通り抜けて値が黙って消えていた
    const r = parseTextDslV05(図(`values: waiting: "{a} - {b}"`));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(
      r.errors.some((e) => e.message.includes("1 行にまとめて書けない")),
      `誤りとして伝わっていない: ${r.errors.map((e) => e.message).join(" / ")}`,
    ).toBe(true);
  });

  it("1 行形が黙って消えない (誤りが 0 件で値も 0 件にならない)", () => {
    // 「誤りとして伝える」 の裏返し。 通ってしまう実装だと ok になり値が空で返る =
    // 書いた人はどこにも手掛かりを得られない
    const src = 図(`values: waiting: "{a} - {b}"`);
    const r = parseTextDslV05(src);
    const 静かに消えた = r.ok && 読めた値(src).length === 0;
    expect(静かに消えた, "誤りも出ず値も読まれない = 黙って消えている").toBe(false);
  });

  it("字下げして並べる正しい形は通る", () => {
    // 誤りを弾く検査だけだと「全部弾く」 実装でも通るため、通る側も固定する
    const src = 図(`states:
  a: 10
  b: 3

values:
  waiting: "{a} - {b}"`);
    const r = parseTextDslV05(src);
    expect(r.ok, r.ok ? "" : r.errors.map((e) => `L${e.line}: ${e.message}`).join(" / ")).toBe(true);
    expect(読めた値(src).map((v) => v.name)).toEqual(["waiting"]);
  });

  it("入力の大きさ計算に values が入る", () => {
    // 値を数百書いた記法が「小さい入力」 と判定されると上限による防御が効かない。
    // 値は式の解析と評価を伴うので、数が増えた時の負荷は状態より大きい
    const 値なし = 図(`states:
  a: 1`);
    const 値あり = 図(`states:
  a: 1

values:
  v1: "{a} + 1"
  v2: "{a} + 2"
  v3: "{a} + 3"`);
    const 数える = (src: string) => {
      const r = parseTextDslV05(src);
      if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
      return countDocElements(r.doc);
    };
    expect(数える(値あり) - 数える(値なし)).toBe(3);
  });
});

describe("DslValue が公開されている (#1169)", () => {
  it("型として import できる", () => {
    // 兄弟の DslState / DslTween / DslSet は公開されており、これだけ漏れていた。
    // 型は実行時に残らないので、値を通して使えることで確かめる
    const v: DslValue = { name: "waiting", expression: "{a} - {b}", pos: { line: 1 } };
    expect(v.name).toBe("waiting");
  });
});
