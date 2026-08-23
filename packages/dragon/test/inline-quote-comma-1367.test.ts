import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";

/**
 * 中括弧の中で、引用符の中のカンマが区切りにならないことの検査 (#1367)。
 *
 * 中括弧の中身を項目ごとに割る処理が入れ子 (`[` / `{`) しか見ておらず、値の中のカンマも
 * 区切りとして扱っていた。 `{ subtitle: "a, b" }` の補足が `"a` に切れて図に出る。
 *
 * 配列 (`{ initial: '["入力", "確認"]' }`) が壊れていなかったのは角括弧の深さで守られていたため。
 * 引用符だけで守られる値は守られていなかった。
 */

/** 1 箱だけの図を組み立てて、その箱を返す */
const 箱 = (中括弧: string) => {
  const d = textDslToDiagram(`title: "t"
type: flow

actors:
  - A: ${中括弧}
  - B: { kind: card }

flow:
  - A -> B: "x"

animation:
  - step: "s" 1s
    focus: [A]
`);
  const n = d.nodes.find((x) => x.title === "A");
  expect(n, "箱 A が見つからない (検査が空振りしている)").toBeDefined();
  return n!;
};

describe("引用符の中のカンマで値が切れない (#1367)", () => {
  it("二重引用の中のカンマが値として残る", () => {
    expect(箱('{ kind: card, subtitle: "orderId, total" }').subtitle).toBe("orderId, total");
  });

  it("単引用の中のカンマが値として残る", () => {
    expect(箱("{ kind: card, subtitle: 'orderId, total' }").subtitle).toBe("orderId, total");
  });

  it("カンマの後ろの項目も読める (値だけを飲み込んでいない)", () => {
    // 引用符の中を丸ごと飲み込む実装だと、後ろの `value` が消える
    const n = 箱('{ subtitle: "a, b", kind: card, value: "42" }');
    expect(n.subtitle).toBe("a, b");
    expect(n.kind).toBe("card");
    expect(n.value).toBe("42");
  });

  it("引用符の中の別種の引用符は文字として残る", () => {
    // 開いた記号と同じものだけが閉じる = `'` は `"` の中では文字
    const n = 箱(`{ kind: card, subtitle: "Guns N' Roses", value: "5:56" }`);
    expect(n.subtitle).toBe("Guns N' Roses");
    expect(n.value, "後ろの項目が消えている").toBe("5:56");
  });

  it("別種の引用符とカンマが同じ値に入っても切れない", () => {
    /*
     * **上の検査だけでは「同じ記号だけが閉じる」 扱いを確かめられない** (#1367 の変異試験で実測)。
     *
     * 別種の引用符でも閉じる実装にすると引用符の開閉が食い違い、最後まで閉じないまま終わる。
     * すると閉じない時の落とし先 (これまでどおりの割り方) に入り、カンマの無い値では
     * 結果が同じになるため差が出ない。
     *
     * 同じ値にカンマも入れると、落とし先ではそこで割れてしまうので差が出る。
     */
    const n = 箱(`{ kind: card, subtitle: "Guns N' Roses, live", value: "5:56" }`);
    expect(n.subtitle).toBe("Guns N' Roses, live");
    expect(n.value, "後ろの項目が消えている").toBe("5:56");
  });

  it("角括弧で守られている書き方は変わらない", () => {
    // 変更前から通っていた形。 引用符を見るようにしても読み方が変わらない
    const n = 箱(`{ kind: card, rows: ["x: 1", "y: 2"] }`);
    expect(n.rows).toEqual(["x: 1", "y: 2"]);
  });

  it("引用符の外のカンマでは今までどおり割れる (陰性対照)", () => {
    /*
     * 「カンマで割らない」 だけの実装でも上の検査は通る。 割れなくなっていないことを見る。
     */
    const n = 箱("{ kind: card, subtitle: ab, value: cd }");
    expect(n.subtitle).toBe("ab");
    expect(n.value, "カンマで割れていない").toBe("cd");
  });

  it("閉じない引用符ではこれまでどおり割る", () => {
    /*
     * 壊れた入力で挙動を変えない。 引用符が閉じないまま飲み込むと、後ろの項目が丸ごと消える。
     * これまでどおり割れば、少なくとも後ろの項目は読める。
     */
    const n = 箱('{ kind: card, subtitle: "a, value: cd }');
    expect(n.value, "閉じない引用符で後ろの項目が消えた").toBe("cd");
  });
});
