import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05/parser";

/**
 * `values` (他の値から自動で決まる値) の記法検査 (#1162 段 1)。
 *
 * ここで見るのは **記法として読めるか**まで。 式を実際に解くのは描画側 (cdl) が毎 frame
 * 行うため、 値が動くことの検査は描画側にある。
 */

const src = (body: string): string => `title: "t"\ntype: flow\n\nactors:\n  - A\n\n${body}`;

const parse = (body: string) => parseTextDslV05(src(body));

const ok = (body: string) => {
  const r = parse(body);
  if (!r.ok) throw new Error(`parse failed: ${r.errors.map((e) => e.message).join(" / ")}`);
  return r.doc;
};

const errs = (body: string): string[] => {
  const r = parse(body);
  return r.ok ? [] : r.errors.map((e) => e.message);
};

describe("読める形", () => {
  it("名前と式の組を並べて書ける", () => {
    const doc = ok(`states:\n  inflow: 0\n\nvalues:\n  waiting: "{inflow} - {done}"\n  busy: "{waiting} > 80"`);
    expect(doc.values).toEqual([
      { name: "waiting", expression: "{inflow} - {done}", pos: { line: 11 } },
      { name: "busy", expression: "{waiting} > 80", pos: { line: 12 } },
    ]);
  });

  it("引用符は付けても付けなくてもよい", () => {
    const doc = ok(`values:\n  a: {b} + 1`);
    expect(doc.values?.[0]?.expression).toBe("{b} + 1");
  });

  it("四則 / 括弧 / 比較 / min / max が書ける", () => {
    const doc = ok(
      `values:\n` +
        `  a: "({x} + {y}) * 2 - 6 / 3"\n` +
        `  b: "{x} >= {y}"\n` +
        `  c: "{x} != {y}"\n` +
        `  d: "min({x}, {y}) + max({x}, 3)"`,
    );
    expect(doc.values).toHaveLength(4);
  });

  it("式は評価せずそのまま持つ (解くのは描画側)", () => {
    // ここで畳むと、 段の補間中に決まり直せなくなる
    const doc = ok(`values:\n  a: "1 + 1"`);
    expect(doc.values?.[0]?.expression).toBe("1 + 1");
  });
});

describe("既存の図の挙動が変わらない (AC)", () => {
  it("values を書かなければ field 自体が生えない", () => {
    const doc = ok(`states:\n  a: 0`);
    expect(doc.values).toBeUndefined();
  });

  it("states と併存できる", () => {
    const doc = ok(`states:\n  inflow: 0\n\nvalues:\n  waiting: "{inflow} - 1"`);
    expect(doc.animate?.states.map((s) => s.name)).toEqual(["inflow"]);
    expect(doc.values?.map((v) => v.name)).toEqual(["waiting"]);
  });

  it("values を states より先に書いてもよい", () => {
    // 順序は参照から解くので、 書く順は結果に影響しない (解くのは描画側)
    const doc = ok(`values:\n  waiting: "{inflow} - 1"\n\nstates:\n  inflow: 0`);
    expect(doc.values).toHaveLength(1);
    expect(doc.animate?.states).toHaveLength(1);
  });
});

describe("記法として書けない形は読む時に弾く", () => {
  it("1 行にまとめて書く形は受けない", () => {
    // 式に `,` が入る (`min({a}, {b})`) ため、 素朴な `,` 分割では式が壊れる
    expect(errs(`values: { a: "{b} + 1" }`).join()).toContain("1 行にまとめて書けない");
  });

  it("名前が規則に合わない", () => {
    expect(errs(`values:\n  1abc: "{b} + 1"`).join()).toContain("invalid value name");
    expect(errs(`values:\n  待ち: "{b} + 1"`).join()).toContain("invalid value name");
  });

  it("式が空", () => {
    expect(errs(`values:\n  a: ""`).join()).toContain("式が空です");
  });

  it("組になっていない", () => {
    expect(errs(`values:\n  a`).join()).toContain("値の行が読めません");
  });

  it("余り (%) は書けない", () => {
    expect(errs(`values:\n  a: "{b} % 2"`).join()).toContain("%");
  });

  it("条件分岐 (?:) は書けない", () => {
    expect(errs(`values:\n  a: "{b} > 1 ? 10 : 0"`).join()).toContain("条件分岐");
  });

  it("min / max 以外の関数は書けない", () => {
    expect(errs(`values:\n  a: "abs({b})"`).join()).toContain('"abs" は式に書けない');
    expect(errs(`values:\n  a: "round({b})"`).join()).toContain('"round" は式に書けない');
  });

  it("min / max に Math. を付けない", () => {
    const e = errs(`values:\n  a: "Math.min({b}, 1)"`);
    expect(e.join()).toContain("Math.min");
  });

  it("波括弧で囲っていない名前は書けない", () => {
    // `{名前}` に揃えないと、 描画側が値の参照として読まない
    expect(errs(`values:\n  a: "inflow - 1"`).join()).toContain('"inflow" は式に書けない');
  });

  it("参照の中身が規則に合わない", () => {
    expect(errs(`values:\n  a: "{待ち} + 1"`).join()).toContain("invalid reference");
    expect(errs(`values:\n  a: "{v.done} + 1"`).join()).toContain("invalid reference");
  });

  it("閉じていない波括弧", () => {
    expect(errs(`values:\n  a: "{b + 1"`).join()).toContain('unclosed "{"');
  });

  it("記法にない記号", () => {
    expect(errs(`values:\n  a: "{b} & 1"`).join()).toContain("式に書けない");
    expect(errs(`values:\n  a: "{b} | 1"`).join()).toContain("式に書けない");
  });

  it("名前に紛れた記号を式の記号と読み違えない", () => {
    // 参照の中身と外側を分けて見ていないと、 ここが「% が書けない」 側で弾かれる
    const e = errs(`values:\n  a: "{b%c} + 1"`);
    expect(e.join()).toContain("invalid reference");
    expect(e.join()).not.toContain('"%" は式に書けない');
  });
});

describe("状態の名前も値と同じ規則で見る (#1181)", () => {
  // 判定は `value-syntax.ts` の 1 か所にある。 状態を書く 3 箇所 (`states:` / `tween` / `set`)
  // が同じ関数を呼ぶことで、「値では弾かれる名前が状態では通る」 形を無くす。
  //
  // 通してはいけない理由は描画側にある。 `{名前}` を置き換える時に見るのも英数字と `_` の
  // 範囲なので、日本語の名前を受け付けると「書けたのに置き換わらない」 図ができる。

  it("`states:` の名前が規則を外れたら誤りにする", () => {
    // 返る理由を名前の案内へ寄せた (#2401)。 形の案内 (`name: initial` の形で書く) を返していた
    // 頃は、書いた本文がその形そのものなので **案内に従っても直らなかった**
    expect(errs(`states:\n  流入: 0`).join()).toContain("invalid value name");
  });

  it("`tween` の状態名が規則を外れたら誤りにする", () => {
    const src = `animation:\n  - step: "動く" 1.4s\n    tween: 流入 0 -> 10`;
    expect(errs(src).join()).toContain("変化の書き方が読めません");
  });

  it("`set` の状態名が規則を外れても図に載せない", () => {
    // `set` は読めない行を黙って捨てる (誤りにしない) ので、載っていないことで見る
    const doc = ok(`animation:\n  - step: "動く" 1.4s\n    set: 流入 5`);
    expect(doc.animate?.phases[0]?.sets ?? []).toHaveLength(0);
  });

  it("規則に合う名前は今まで通り読む", () => {
    // 上の 3 件だけだと、全ての状態を弾く形でも通ってしまう
    const doc = ok(
      `states:\n  inflow: 0\n\nanimation:\n  - step: "動く" 1.4s\n    tween: inflow 0 -> 10\n    set: inflow 3`,
    );
    expect(doc.animate?.states).toEqual([{ name: "inflow", initial: 0, pos: { line: 8 } }]);
    expect(doc.animate?.phases[0]?.tweens ?? []).toHaveLength(1);
    expect(doc.animate?.phases[0]?.sets ?? []).toHaveLength(1);
  });
});

describe("top-level key として案内に載る", () => {
  it("読めない行の案内に values が並ぶ", () => {
    const r = parseTextDslV05(`title: "t"\ntype: flow\n\nactors:\n  - A\n\nvaluez`);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => (e.hint ?? "").includes("values"))).toBe(true);
  });
});
