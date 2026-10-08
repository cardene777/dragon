/*
 * 木の札の幅を、記法の側が自分で決めないことを見る (#2718 / cdl#970)。
 *
 * それまで `compileTree` は `図表の大きさ.tree` の `w` (720) をそのまま渡していた。
 * 必要な幅は葉の数で変わるので、葉が少ない図は札の中で浮く
 * (実測 = 葉 2 枚の図が 720 の札に中身 375 で、左右に 172 ずつ余った)。
 *
 * 規則は描画側 (`@cardenelabs/cdl` の `木の札の幅`) が持つ。
 * ここで見るのは「引いた値をそのまま渡しているか」 だけで、規則そのものは見ない。
 * 規則を写すと、描画側が割付を変えた時にこちらだけが古い幅を渡す。
 */
import { 木の札の幅 } from "@cardenelabs/cdl";
import { describe, expect, it } from "vitest";
import { textDslToDiagram } from "../src/index";
import { 図表の大きさ } from "../src/compile/chart-fields";

/** 葉が 2 枚。 幅の退行を再現するための独立した記法 */
const 葉2枚 = `title: "幅の検査用の階層"
type: tree
actors:
  - dragon
  - 記法
  - 描画
  - 読み取り
  - 配置
flow:
  - dragon -> 記法
  - dragon -> 描画
  - 記法 -> 読み取り
  - 描画 -> 配置
`;

/** 葉が 3 枚。 式の値が既定を超え、描画側の頭打ちが効く形 */
const 葉3枚 = `title: "会社の指揮系統"
type: tree
actors:
  - 社長
  - 技術責任者
  - 財務責任者
  - 開発部長
  - 運用部長
flow:
  - 社長 -> 技術責任者
  - 社長 -> 財務責任者
  - 技術責任者 -> 開発部長
  - 技術責任者 -> 運用部長
`;

const 木の箱 = (src: string) => {
  const d = textDslToDiagram(src);
  const n = d.nodes.find((x) => x.kind === "tree-hierarchy");
  expect(n, "木の箱が組み上がっていない").toBeDefined();
  return n!;
};

describe("木の札の幅を描画側に聞く (#2718)", () => {
  it("葉が 2 枚の図の札が、描画側が出した幅と一致する", () => {
    const n = 木の箱(葉2枚);
    expect(n.w).toBe(木の札の幅(n.treeData ?? []));
  });

  it("葉が 3 枚の図の札も、描画側が出した幅と一致する", () => {
    const n = 木の箱(葉3枚);
    expect(n.w).toBe(木の札の幅(n.treeData ?? []));
  });

  it("葉が 2 枚の図の札が、既定の 720 より狭い", () => {
    // 表の値を渡していた頃は 720 で、中身 375 に対して左右に 172 ずつ余った
    expect(木の箱(葉2枚).w).toBeLessThan(720);
  });

  it("葉が 3 枚の図の札は 720 のまま", () => {
    // 式の値は 754 で既定を超える。 描画側の頭打ちが効く
    expect(木の箱(葉3枚).w).toBe(720);
  });

  it("葉が多い図ほど札が広い", () => {
    expect(木の箱(葉3枚).w ?? 0).toBeGreaterThan(木の箱(葉2枚).w ?? 0);
  });

  it("札の高さは葉の数で変わらない", () => {
    expect(木の箱(葉2枚).h).toBe(図表の大きさ.tree.h);
    expect(木の箱(葉3枚).h).toBe(図表の大きさ.tree.h);
  });

  it("並べる帯が札より広い", () => {
    // 帯が札より狭いと箱が帯からはみ出す
    const d = textDslToDiagram(葉2枚);
    const n = d.nodes.find((x) => x.kind === "tree-hierarchy")!;
    const lane = d.lanes.find((l) => l.id === n.lane);
    expect(lane?.width ?? 0).toBeGreaterThan(n.w ?? 0);
  });
});
