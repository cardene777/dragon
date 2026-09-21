/**
 * 図種ごとの既定の向き (#2424)。
 *
 * ## なぜ値そのものを書くか
 *
 * 隣の `direction-same-as-default-2421.test.ts` は既定を `既定の向き` から **導く**。
 * 導く側だけだと、既定を縦へ戻しても 1 件も落ちない = 変えた事実が検査に残らない。
 * ここは逆に **値を書き写す** ことで、既定を変える時に必ずこの file が落ちるようにする。
 *
 * ## フローを横にした理由
 *
 * 縦に積むと描く広さが幅より高くなり、器に入らない
 * (実測 = 見本の頁の「フロー」 が 576×920 で、器 1150×630px を縦にはみ出した)。
 * 横に並べると 1 人 1 縦列になり、2536×272 で幅の側へ伸びる。
 *
 * `topology` だけ縦のまま = 入れ物 (`contain`) を持つ図で、縦列の中に箱を囲む作りが
 * 向きと結びついている。
 *
 * ## 変わらない側も見る
 *
 * 動きも縦列も向きも書かないフローは、箱を鎖のようにつなぐ別の組み立てを通り
 * 既定の向きを読まない。 既定を変えても 1 件も動かないことを対照として置く。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram, PRESET_TYPES } from "../src/index";
import { 既定の向き } from "../src/compile/direction";

/** 縦を既定にする図種。 ここに無い図種は全て横 */
const 縦が既定 = new Set<string>(["topology"]);

const 記法 = (動きを書く: boolean): string =>
  [
    'title: "確かめ"',
    "type: flow",
    "",
    "actors:",
    "  - 受付",
    "  - 処理",
    "  - 保存",
    "",
    "flow:",
    '  - 受付 -> 処理: "渡す"',
    '  - 処理 -> 保存: "書く"',
    ...(動きを書く
      ? ["", "animation:", '  - step: "1 つ目" 1.0s', '    focus: ["受付"]', '    description: "説明"']
      : []),
    "",
  ].join("\n");

describe("図種ごとの既定の向き (#2424)", () => {
  it("フローの既定は横", () => {
    expect(既定の向き("flow")).toBe("横");
  });

  it("入れ物を持つ図の既定は縦", () => {
    expect(既定の向き("topology")).toBe("縦");
  });

  it("残りの図種の既定は全て横", () => {
    const 残り = [...PRESET_TYPES].filter((t) => !縦が既定.has(t));
    // 空振り防止。 図種が 1 つも取れないまま「全て横」 と報告しない
    expect(残り.length, "図種が取れていない (検査が空振りしている)").toBeGreaterThan(5);
    expect(
      残り.filter((t) => 既定の向き(t) !== "横"),
      `横でない図種が残っている (母数 ${残り.length} 件)`,
    ).toEqual([]);
  });

  it("動きを書いたフローは 1 人 1 縦列で横に並ぶ", () => {
    const d = textDslToDiagram(記法(true));
    expect(d.nodes.map((n) => n.title)).toEqual(["受付", "処理", "保存"]);
    // 縦列が箱の数だけあり、どの箱も自分の縦列の 0 段目に立つ = 横並び
    expect((d.lanes ?? []).length, "縦列が 1 人 1 本になっていない").toBe(3);
    expect(d.nodes.map((n) => n.stack)).toEqual([0, 0, 0]);
    expect(new Set(d.nodes.map((n) => n.lane)).size, "2 人が同じ縦列に入っている").toBe(3);
  });

  it("動きを書かないフローは鎖のまま 1 縦列 (既定の向きを読まない)", () => {
    const d = textDslToDiagram(記法(false));
    expect((d.lanes ?? []).length, "鎖の経路が既定の向きを読み始めている").toBe(1);
    expect(d.nodes.map((n) => n.stack), "鎖は上から順に積む").toEqual([0, 1, 2]);
  });
});
