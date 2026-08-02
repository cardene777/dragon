import { describe, it, expect } from "vitest";
import { buildAutoFixOffsets, countFixableWarnings, edgeIdOf, FIXABLE_WARNING_AXES } from "./auto-fix-offsets";

/**
 * 位置関係の警告から offset を組み立てる判定を固定する (#382)。
 *
 * これまで判定は `CdlEditor` の中に 2 箇所 (`handleAutoFix` / `fixableWarningCount`) あり、
 * editor を丸ごと描かないと確かめられなかったので **test が 1 件も無かった**。
 *
 * 特に「N 件対応可」 と出して 0 件しか当たらない食い違い (#382 の課題 3) は、 2 箇所が別々に
 * 判定していたことが原因。 同じ関数から導くことで構造的に消える。
 */

const W = (axis: string, detail: string) => ({ axis, detail });

describe("offset を当てられる軸", () => {
  it("3 軸だけ", () => {
    expect([...FIXABLE_WARNING_AXES].sort()).toEqual(
      ["clearance", "edge-label-overlap", "edge-label-proximity"],
    );
  });
});

describe("edge の id を取り出す", () => {
  it.each([
    ['edge "e0-user-post" label が path segment から 90px 離れている', "e0-user-post"],
    ["node:api ↔ edge-label:e1-a-b overlap=1200", "e1-a-b"],
    ["node:api ↔ node:db gap=4", null],
    ["", null],
  ])("%s", (detail, expected) => {
    expect(edgeIdOf(detail)).toBe(expected);
  });
});

describe("警告から offset を組み立てる", () => {
  it("label が node に埋まっていれば上へ逃がす", () => {
    const m = buildAutoFixOffsets([W("edge-label-overlap", "node:api ↔ edge-label:e1 overlap=1200")]);
    expect(Object.fromEntries(m)).toEqual({ e1: { offsetY: -140 } });
  });

  it("隣接が足りなければ更に離す", () => {
    const m = buildAutoFixOffsets([W("clearance", "node:api ↔ edge-label:e1 gap=4")]);
    expect(Object.fromEntries(m)).toEqual({ e1: { offsetY: -80 } });
  });

  it("線から離れすぎていれば距離の半分だけ寄せる", () => {
    const m = buildAutoFixOffsets([W("edge-label-proximity", 'edge "e1" label が path segment から 90px 離れている')]);
    expect(Object.fromEntries(m)).toEqual({ e1: { offsetY: 45 } });
  });

  it("距離を読み取れない proximity は entry を作らない", () => {
    // 空の entry を残すと `size` が増えて「1 件当てた」 と表示されるのに、 実際には何も
    // 変わらない (codex review Round 1 の指摘)。
    const m = buildAutoFixOffsets([W("edge-label-proximity", 'edge "e1" label が path から遠い')]);
    expect(Object.fromEntries(m)).toEqual({});
  });

  it("同じ edge に複数の警告が来たら積む", () => {
    // clearance が 2 件重なると -40 ずつ増える。 これは現状の挙動で、 幾何から最小の移動量を
    // 導く形 (#382 の課題 2) に差し替える時にここが変わる。
    const m = buildAutoFixOffsets([
      W("clearance", "node:a ↔ edge-label:e1 gap=4"),
      W("clearance", "node:b ↔ edge-label:e1 gap=2"),
    ]);
    expect(Object.fromEntries(m)).toEqual({ e1: { offsetY: -120 } });
  });

  it("対応外の軸は無視する", () => {
    expect(buildAutoFixOffsets([W("text-readability", 'edge "e1" 文字が小さい')]).size).toBe(0);
  });

  it("edge の id を取り出せない警告は無視する", () => {
    expect(buildAutoFixOffsets([W("clearance", "node:api ↔ node:db gap=4")]).size).toBe(0);
  });
});

describe("表示する件数と実際に当たる件数が一致する", () => {
  /**
   * #382 の課題 3。 以前は「対応可能な軸を持つ警告」 を数えていたので、 edge の id を
   * 取り出せない警告があると「1 件対応可」 と出して 0 件しか当たらなかった。
   */
  it.each([
    [
      "id を取り出せない対応軸が混ざる",
      [W("clearance", "node:api ↔ node:db gap=4"), W("clearance", "node:a ↔ edge-label:e1 gap=4")],
    ],
    [
      "対応外の軸が混ざる",
      [W("text-readability", 'edge "e9" 小さい'), W("edge-label-overlap", "node:a ↔ edge-label:e1 overlap=1")],
    ],
    ["同じ edge を複数の警告が指す", [
      W("clearance", "node:a ↔ edge-label:e1 gap=4"),
      W("edge-label-overlap", "node:b ↔ edge-label:e1 overlap=1"),
    ]],
    ["対応できる警告が 1 件も無い", [W("text-readability", 'edge "e9" 小さい')]],
    // **これが #382 の課題 3 そのもの**。 対応軸だが id を取り出せない警告だけ = 軸だけで
    // 数えると「1 件対応可」 と出るのに 0 件しか当たらない。 この形が無いと、 軸だけで数える
    // 実装に戻しても他の fixture は全部通る (実測)。
    ["対応軸だが id を取り出せない警告だけ", [W("clearance", "node:api ↔ node:db gap=4")]],
    // 距離を読み取れない proximity も同じ形。 軸も id も揃っているのに当てる値が決まらない
    // = 数えると 1 件、 当たるのは 0 件になる (codex review Round 1 の MINOR)。
    ["距離を読み取れない proximity だけ", [W("edge-label-proximity", 'edge "e1" label が path から遠い')]],
  ])("%s", (_label, warnings) => {
    const applied = buildAutoFixOffsets(warnings);
    // 「当たる警告の数」 と「offset を持つ edge の数」 は別の量。 前者を数え、 0 件かどうかが
    // 一致することを見る (件数そのものは同じ edge を複数の警告が指すとずれる)。
    expect(countFixableWarnings(warnings) > 0).toBe(applied.size > 0);
  });

  it("同じ edge を 2 件が指すと、 警告は 2 件 / edge は 1 件", () => {
    // 上の test が「常に 0 か 0 でないか」 しか見ていないので、 数の関係を別に固定する。
    const warnings = [
      W("clearance", "node:a ↔ edge-label:e1 gap=4"),
      W("edge-label-overlap", "node:b ↔ edge-label:e1 overlap=1"),
    ];
    expect(countFixableWarnings(warnings)).toBe(2);
    expect(buildAutoFixOffsets(warnings).size).toBe(1);
  });
});
