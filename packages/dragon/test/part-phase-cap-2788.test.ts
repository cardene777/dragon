/**
 * 部品の段が、取り込み先の段数を増やさないことの検証 (#2788)。
 *
 * ## なぜこの規則か
 *
 * 信号機や星の評価のように、順番そのものが意味を持つ部品がある。 段を 1 つに縛ると
 * 値が終端に達した後ずっと同じ絵になり、何をする物なのかが伝わらない。
 *
 * 一方で、段を増やした部品を置いただけで取り込み先の段数が伸びると、書き手が決めた
 * 筋書きと画面の段数が食い違う。 以前は余った段を後ろへ足していたのでこれが起きた。
 *
 * そこで **余った段は落とす** 側へ寄せた。 部品は単体の頁で全段を見せられて、
 * 段を持つ取り込み先の段数は変わらない。
 *
 * ## 何を見るか
 *
 * | 取り込み先 | 見ること |
 * |---|---|
 * | 段を 1 つ持つ | 段は 1 つのまま。 部品の 1 段目だけが重なる |
 * | 段を 2 つ持つ | 段は 2 つのまま。 部品の 1-2 段目が重なる |
 * | 段を 1 つも持たない | 部品の段がそのまま入る (壊す筋書きが無い) |
 *
 * 最後の行を混ぜているのは、落とす側へ寄せた結果「どこでも落ちる」 にしていないため。
 */
import { describe, it, expect } from "vitest";
import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";

/** 段を 3 つ持つ部品 (信号機と同じ形) */
const 三段の部品: CdlDiagram = diagram("parts-three-phase", { topic: "three" })
  .lane("l", { width: 200 })
  .state("v", { initial: 0 })
  .node("c", {
    lane: "l",
    stack: 0,
    kind: "dyn-circle",
    title: "灯",
    w: 180,
    h: 180,
    shape: { kind: "circle", radius: 70, fillProgress: "{v}", fill: "#22c55e" },
  })
  .phase("q1", { duration: 1000, title: "点く", body: "" }, (p: PhaseBuilder) =>
    p.activate("c").tween("v", 0, 1),
  )
  .phase("q2", { duration: 1000, title: "落ちる", body: "" }, (p: PhaseBuilder) =>
    p.tween("v", 1, 0.4),
  )
  .phase("q3", { duration: 1000, title: "戻る", body: "" }, (p: PhaseBuilder) =>
    p.tween("v", 0.4, 1),
  )
  .build();

const 一覧: Record<string, CdlDiagram> = { "three-phase": 三段の部品 };

function 組む(本文: string): CdlDiagram {
  return textDslToDiagram(本文, { partsCatalog: 一覧 });
}

const 頭 = `title: "見本"
type: flow

lanes:
  l: { x: 0, width: 400 }

actors:
  - 受付: { kind: card, lane: l, stack: 0 }
  - 灯り: { kind: three-phase, lane: l, stack: 1 }
`;

describe("部品の段は取り込み先の段数を増やさない (#2788)", () => {
  it("段を 1 つ持つ図に置いても段は 1 つのまま", () => {
    const 図 = 組む(`${頭}
animation:
  - step: "受け付ける" 2s
    focus: ["受付"]
`);
    expect(図.phases.length).toBe(1);
  });

  it("段を 2 つ持つ図に置いても段は 2 つのまま", () => {
    const 図 = 組む(`${頭}
animation:
  - step: "受け付ける" 2s
    focus: ["受付"]
  - step: "返す" 2s
    focus: ["受付"]
`);
    expect(図.phases.length).toBe(2);
  });

  it("段を持たない図に置くと、部品の段がそのまま入る", () => {
    // 落とす側へ寄せた結果「どこでも落ちる」 にしていないことを見る対照。
    // ここで落とすと、部品を 1 つ置いただけの図が静止画になる
    const 図 = 組む(頭);
    expect(図.phases.length).toBe(3);
  });

  it("重なるのは取り込み先の段数までで、残りは 1 件も入らない", () => {
    // 段数だけ見ると、落とさず上書きした形でも通る。 動かす値の件数で中身を見る
    const 図 = 組む(`${頭}
animation:
  - step: "受け付ける" 2s
    focus: ["受付"]
`);
    const 動かす値 = 図.phases.flatMap((p) => p.tweens ?? []);
    expect(動かす値.length, "1 段目の tween 1 件だけが入る").toBe(1);
    expect(動かす値[0]!.to).toBe(1);
  });
});
