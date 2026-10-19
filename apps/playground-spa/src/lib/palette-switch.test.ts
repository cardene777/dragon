import { describe, expect, it } from "vitest";
import { THEMES, textDslToDiagram, type DslTheme } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { sourceYaml__erShapeSmall } from "@/topics/catalog/er-shapes";
import {
  sourceYaml__presetDeliveryClasses,
  sourceYaml__presetDeliveryRelations,
} from "@/topics/catalog/presets.cdl";
import { 図の配色を変える, 配色の選択肢, 押される配色, 画面の色 } from "./palette-switch";

const 図 = (palette?: string, textMetrics?: CdlDiagram["textMetrics"]): CdlDiagram => ({
  id: "t",
  topic: "t",
  lanes: [],
  nodes: [],
  edges: [],
  states: [],
  phases: [],
  ...(palette === undefined ? {} : { palette }),
  ...(textMetrics === undefined ? {} : { textMetrics }),
});

describe("見本帳の意匠の切替から色だけの 2 意匠を外す (#2960)", () => {
  it("意匠の選択肢は地まで含めて描く 7 つの意匠だけを並べる", () => {
    expect(配色の選択肢).toEqual(["blueprint", "letterpress", "catalog", "terminal", "sketch", "neon", "relief"]);
  });
});

/*
 * 外から意匠を当てた図と、同じ意匠を書いた図を比べる (#2960)。
 *
 * 見本は行の縞を敷くために `palette: kinari` を書いていた。 その行を消すと縞は外から当てた
 * 意匠に頼るが、切替は縞を宅配の 2 図でしか扱わなかった。 書いた時と同じ処理を通ることを、
 * 宅配の 2 図と、それ以外の行を書いた表の箱と、棒の図で確かめる。
 */
describe("外から当てた意匠は書いた意匠と同じ棒の角と行の縞になる (#2960)", () => {
  /** 意匠で決まる 2 つの値。 骨組みは別の検査 (`catalog-delivery-four-templates`) が見る */
  const 意匠で決まる値 = (diagram: CdlDiagram) =>
    diagram.nodes.map((node) => ({ id: node.id, rowStripe: node.rowStripe, barCornerRadii: node.barCornerRadii }));

  /** 本文の最上位の意匠の行を外す。 字下げした行 (箱や段の中) には触れない */
  const 意匠を外す = (本文: string): string => 本文.replace(/^(?:theme|palette):.*\n/gm, "");
  /** 本文の `type:` の次の行に意匠を書く */
  const 意匠を書く = (本文: string, 意匠: DslTheme): string =>
    意匠を外す(本文).replace(/^(type:.*\n)/m, `$1theme: ${意匠}\n`);

  /** 行を書いた表の箱と、書き手が縞を断った箱と、行の無い箱を持つ表の図 */
  const 表の図 = [
    'title: "確かめ"',
    "type: record",
    "",
    "actors:",
    '  - users: { kind: storage, rows: ["id: bigint", "email: text"], marks: ["pk", ""] }',
    '  - orders: { kind: storage, rowStripe: false, rows: ["id: bigint", "user_id: bigint"], marks: ["pk", "fk"] }',
    "  - 待機: { kind: storage }",
    "",
    "flow:",
    '  - users -> orders: "注文する"',
    "",
  ].join("\n");

  const 棒の図 = 'title: "確かめ"\ntype: chart\nshape: bar\n\nactors:\n  - A: "80"\n  - B: "20"\n\nflow:\n  - A -> B\n';

  /** 見本帳と同じく、組み立てた図へ id を載せる。 切替が id で図を見分けていても同じ形で通る */
  const 図たち = [
    ["表の図", "t-record", 表の図],
    ["棒の図", "t-chart", 棒の図],
    ["見本帳の小さい表の図", "er-shape-small", sourceYaml__erShapeSmall],
    ["宅配の関係", "delivery-relations-demo", sourceYaml__presetDeliveryRelations],
    ["宅配の型", "delivery-classes-demo", sourceYaml__presetDeliveryClasses],
  ] as const;

  const 組 = 図たち.flatMap(([名前, id, 本文]) => THEMES.map((意匠) => [名前, 意匠, id, 本文] as const));

  it("比べる組がある (検査が空振りしていない)", () => {
    expect(組.length).toBe(図たち.length * THEMES.length);
  });

  it("表の図は行を書いた箱を持つ (縞を比べる相手がいる)", () => {
    const 縞 = textDslToDiagram(意匠を書く(表の図, "catalog")).nodes.map((node) => node.rowStripe);
    expect(縞).toContain(true);
  });

  it.each(組)("%s へ外から %s を当てると、書いた図と同じ値になる", (_名前, 意匠, id, 本文) => {
    const 元 = textDslToDiagram(意匠を外す(本文));
    元.id = id;
    const 書いた = textDslToDiagram(意匠を書く(本文, 意匠));
    expect(意匠で決まる値(図の配色を変える(元, 意匠))).toEqual(意匠で決まる値(書いた));
  });
});

describe("見本帳の意匠の切替 (#2790)", () => {
  it("意匠の選択肢は THEMES の全件と同じ順で、画面の色を含まない", () => {
    expect(配色の選択肢.length, "選択肢が空で検査が空振りしている").toBeGreaterThan(0);
    expect(配色の選択肢).toEqual(THEMES);
    expect(配色の選択肢).not.toContain(画面の色);
  });

  it("選んでいない時は元の object をそのまま返す", () => {
    const 元 = 図("blueprint");
    expect(図の配色を変える(元, null)).toBe(元);
  });

  it("画面の色は palette だけを外し、元から無ければ同じ object を返す", () => {
    const 持つ = 図("letterpress");
    const 外した = 図の配色を変える(持つ, 画面の色);
    expect(外した).not.toBe(持つ);
    expect(外した.palette).toBeUndefined();
    const 持たない = 図();
    expect(図の配色を変える(持たない, 画面の色)).toBe(持たない);
  });

  it("意匠は同じなら元の object、違うなら palette を差し替えた copy を返す", () => {
    const 元 = 図("letterpress");
    expect(図の配色を変える(元, "letterpress")).toBe(元);
    const 次 = 図の配色を変える(元, "blueprint");
    expect(次).not.toBe(元);
    expect(次.palette).toBe("blueprint");
  });

  it("letterpress switch: 活版を選ぶと palette を letterpress に差し替える", () => {
    const 元 = 図("blueprint");
    const 次 = 図の配色を変える(元, "letterpress");
    expect(次).not.toBe(元);
    expect(次.palette).toBe("letterpress");
    expect(押される配色(次, null)).toBe("letterpress");
  });

  it("catalog switch: 図録を選ぶと palette を catalog に差し替える", () => {
    const 元 = 図("letterpress");
    const 次 = 図の配色を変える(元, "catalog");
    expect(次).not.toBe(元);
    expect(次.palette).toBe("catalog");
    expect(押される配色(次, null)).toBe("catalog");
  });

  it("terminal switch: 端末を選ぶと palette を terminal に差し替える", () => {
    const 元 = 図("catalog");
    const 次 = 図の配色を変える(元, "terminal");
    expect(次).not.toBe(元);
    expect(次.palette).toBe("terminal");
    expect(押される配色(次, null)).toBe("terminal");
  });

  it("sketch switch: 手描きを選ぶと palette を sketch に差し替える", () => {
    const 元 = 図("terminal");
    const 次 = 図の配色を変える(元, "sketch");
    expect(次).not.toBe(元);
    expect(次.palette).toBe("sketch");
    expect(押される配色(次, null)).toBe("sketch");
  });

  it("neon switch: 電飾を選ぶと palette を neon に差し替える", () => {
    const 元 = 図("sketch");
    const 次 = 図の配色を変える(元, "neon");
    expect(次).not.toBe(元);
    expect(次.palette).toBe("neon");
    expect(押される配色(次, null)).toBe("neon");
  });

  it("relief switch: 浮彫を選ぶと palette を relief に差し替える", () => {
    const 元 = 図("neon");
    const 次 = 図の配色を変える(元, "relief");
    expect(次).not.toBe(元);
    expect(次.palette).toBe("relief");
    expect(押される配色(次, null)).toBe("relief");
  });

  it("未選択の押された札は図の意匠に従い、意匠が無ければ画面の色になる", () => {
    expect(押される配色(図("blueprint"), null)).toBe("blueprint");
    expect(押される配色(図(), null)).toBe(画面の色);
    expect(押される配色(図("blueprint"), "catalog")).toBe("catalog");
  });
});

describe("配色と字の測り方を切り離す (#2908)", () => {
  it("活版の図で端末を選んでも textMetrics を足さない", () => {
    const 次 = 図の配色を変える(図("letterpress"), "terminal");
    expect(次.palette).toBe("terminal");
    expect(Object.hasOwn(次, "textMetrics")).toBe(false);
  });

  it("配色を替えても元の textMetrics を保つ", () => {
    expect(図の配色を変える(図("blueprint", "proportional"), "letterpress").textMetrics).toBe("proportional");
  });

  it("画面の色は palette だけを外し、textMetrics を保つ", () => {
    const 次 = 図の配色を変える(図("blueprint", "proportional"), 画面の色);
    expect(["palette" in 次, 次.textMetrics]).toEqual([false, "proportional"]);
  });

  it("textMetrics を持たない terminal の図で端末を選ぶと元の object を返す", () => {
    const 元 = 図("terminal");
    expect(図の配色を変える(元, "terminal")).toBe(元);
  });

  it("widest は7配色と画面の色の全てで変えない", () => {
    for (const palette of [...THEMES, 画面の色] as const) {
      expect(図の配色を変える(図("terminal", "widest"), palette).textMetrics, palette).toBe("widest");
    }
  });

  it("端末記法を組む経路も widest を保つ", () => {
    const 記法 = textDslToDiagram('title: "確かめ"\ntype: flow\ntheme: terminal\n\nactors:\n  - A\n  - B\n\nflow:\n');
    expect(記法.textMetrics).toBe("widest");
  });
});

describe("棒の角の意匠切替 (#2863)", () => {
  const 棒 = (theme?: string) => textDslToDiagram(`title: 見本
type: chart
shape: bar
${theme === undefined ? "" : `theme: ${theme}\n`}actors:
  - A: "80"
  - B: "20"
flow:
  - A -> B
`);

  it("意匠を替えると角を替え、同じ意匠では元の object を返す", () => {
    const 図録 = 棒("catalog");
    const 電飾 = 図の配色を変える(図録, "neon");
    expect(電飾.nodes[0]?.barCornerRadii).toEqual({
      topLeft: 10,
      topRight: 10,
      bottomRight: 3,
      bottomLeft: 3,
    });
    expect(図の配色を変える(電飾, "neon")).toBe(電飾);
  });

  it("画面の色へ替えると角の key を外す", () => {
    const next = 図の配色を変える(棒("neon"), 画面の色);
    expect(Object.hasOwn(next.nodes[0] ?? {}, "barCornerRadii")).toBe(false);
  });

  it("意匠なしの棒へ角を足し、選択を触らない時は元の object を返す", () => {
    const 元 = 棒();
    expect(図の配色を変える(元, null)).toBe(元);
    expect(図の配色を変える(元, "catalog").nodes[0]?.barCornerRadii).toEqual({
      topLeft: 4,
      topRight: 4,
      bottomRight: 0,
      bottomLeft: 0,
    });
  });

  it("棒を描かない漏斗の角は触らない", () => {
    const funnel = textDslToDiagram(`title: 見本
type: funnel
actors:
  - A: "80"
  - B: "20"
flow:
  - A -> B
`);
    const 元の節 = funnel.nodes[0];
    if (元の節 === undefined) throw new Error("漏斗の節が無い");
    元の節.barCornerRadii = { topLeft: 1, topRight: 2, bottomRight: 3, bottomLeft: 4 };
    const next = 図の配色を変える(funnel, "neon");
    expect(next.nodes[0]).toBe(元の節);
    expect(next.nodes[0]?.barCornerRadii).toEqual({
      topLeft: 1,
      topRight: 2,
      bottomRight: 3,
      bottomLeft: 4,
    });
  });
});

describe("円の区画の間は意匠切替で変えない (#2926)", () => {
  const 円 = (theme?: string) => textDslToDiagram(`title: 見本
type: chart
shape: pie
${theme === undefined ? "" : `theme: ${theme}\n`}actors:
  - A: "80"
  - B: "20"
flow:
  - A -> B
`);

  it("電飾へ替えても chartPieSliceGap を足さない", () => {
    const 元 = 円("catalog");
    const next = 図の配色を変える(元, "neon");
    expect(Object.hasOwn(next.nodes[0] ?? {}, "chartPieSliceGap")).toBe(false);
    expect(next.nodes[0]).toBe(元.nodes[0]);
  });

  it.each(["neon", "catalog", "relief", 画面の色] as const)("%s へ替えても元の chartPieSliceGap を保つ", (theme) => {
    const 元 = 円();
    const 円の節 = 元.nodes[0];
    if (円の節 === undefined) throw new Error("円の節が無い");
    円の節.chartPieSliceGap = 5;
    const next = 図の配色を変える(元, theme);
    expect(next.nodes[0]?.chartPieSliceGap).toBe(5);
    expect(next.nodes[0]).toBe(円の節);
  });
});
