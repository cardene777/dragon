import { describe, expect, it } from "vitest";
import { THEMES, textDslToDiagram } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

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
    const 持つ = 図("kinari");
    const 外した = 図の配色を変える(持つ, 画面の色);
    expect(外した).not.toBe(持つ);
    expect(外した.palette).toBeUndefined();
    const 持たない = 図();
    expect(図の配色を変える(持たない, 画面の色)).toBe(持たない);
  });

  it("意匠は同じなら元の object、違うなら palette を差し替えた copy を返す", () => {
    const 元 = 図("kinari");
    expect(図の配色を変える(元, "kinari")).toBe(元);
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
    expect(押される配色(図("kinari"), "celadon")).toBe("celadon");
  });
});

describe("配色と字の測り方を切り離す (#2908)", () => {
  it("生成りの図で端末を選んでも textMetrics を足さない", () => {
    const 次 = 図の配色を変える(図("kinari"), "terminal");
    expect(次.palette).toBe("terminal");
    expect(Object.hasOwn(次, "textMetrics")).toBe(false);
  });

  it("配色を替えても元の textMetrics を保つ", () => {
    expect(図の配色を変える(図("blueprint", "proportional"), "kinari").textMetrics).toBe("proportional");
  });

  it("画面の色は palette だけを外し、textMetrics を保つ", () => {
    const 次 = 図の配色を変える(図("blueprint", "proportional"), 画面の色);
    expect(["palette" in 次, 次.textMetrics]).toEqual([false, "proportional"]);
  });

  it("textMetrics を持たない terminal の図で端末を選ぶと元の object を返す", () => {
    const 元 = 図("terminal");
    expect(図の配色を変える(元, "terminal")).toBe(元);
  });

  it("widest は9配色と画面の色の全てで変えない", () => {
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

  it.each(["kinari", "celadon", 画面の色] as const)("%s へ替えると角の key を外す", (theme) => {
    const next = 図の配色を変える(棒("neon"), theme);
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

describe("円の区画の間の意匠切替 (#2871)", () => {
  const 円 = (theme?: string) => textDslToDiagram(`title: 見本
type: chart
shape: pie
${theme === undefined ? "" : `theme: ${theme}\n`}actors:
  - A: "80"
  - B: "20"
flow:
  - A -> B
`);

  it("電飾へ替えると chartPieSliceGap 3 を付ける", () => {
    const next = 図の配色を変える(円("catalog"), "neon");
    expect(next.nodes[0]?.chartPieSliceGap).toBe(3);
    expect(図の配色を変える(next, "neon")).toBe(next);
  });

  it.each(["catalog", "relief", 画面の色] as const)("%s へ替えると chartPieSliceGap を外す", (theme) => {
    const next = 図の配色を変える(円("neon"), theme);
    expect(Object.hasOwn(next.nodes[0] ?? {}, "chartPieSliceGap")).toBe(false);
  });
});
