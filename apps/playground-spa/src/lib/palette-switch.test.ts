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

describe("端末の字の測り方 (#2818)", () => {
  it("生成りの図で端末を選ぶと palette と textMetrics を持つ copy を返す", () => {
    const 次 = 図の配色を変える(図("kinari"), "terminal");
    expect(次).toMatchObject({ palette: "terminal", textMetrics: "monospace" });
  });

  it("端末の図で生成りを選ぶと textMetrics の key を持たない", () => {
    expect("textMetrics" in 図の配色を変える(図("terminal", "monospace"), "kinari")).toBe(false);
  });

  it("端末の図で画面の色を選ぶと palette と textMetrics の key を持たない", () => {
    const 次 = 図の配色を変える(図("terminal", "monospace"), 画面の色);
    expect(["palette" in 次, "textMetrics" in 次]).toEqual([false, false]);
  });

  it("端末の図で端末を選ぶと元の object をそのまま返す", () => {
    const 元 = textDslToDiagram('title: "確かめ"\ntype: flow\ntheme: terminal\n\nactors:\n  - A\n  - B\n\nflow:\n');
    expect([元.textMetrics, 図の配色を変える(元, "terminal") === 元]).toEqual(["monospace", true]);
  });

  it("textMetrics を持たない terminal の図で端末を選ぶと新しい object を返す", () => {
    const 元 = 図("terminal");
    expect(図の配色を変える(元, "terminal")).not.toBe(元);
  });

  it("textMetrics を持たない terminal の図で端末を選ぶと monospace を載せる", () => {
    expect(図の配色を変える(図("terminal"), "terminal").textMetrics).toBe("monospace");
  });

  it("端末の図で何も選んでいない時は元の object をそのまま返す", () => {
    const 元 = textDslToDiagram('title: "確かめ"\ntype: flow\ntheme: terminal\n\nactors:\n  - A\n  - B\n\nflow:\n');
    expect([元.textMetrics, 図の配色を変える(元, null) === 元]).toEqual(["monospace", true]);
  });

  it("端末以外どうしの切替で textMetrics の key を持たない", () => {
    expect("textMetrics" in 図の配色を変える(図("kinari", "monospace"), "celadon")).toBe(false);
  });

  it("記法の端末指定と見本帳で選ぶ端末は同じ textMetrics になる", () => {
    const 本文 = 'title: "確かめ"\ntype: flow\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "送る"\n';
    const 切替後 = 図の配色を変える(textDslToDiagram(本文), "terminal");
    const 記法で指定 = textDslToDiagram(本文.replace("type: flow", "type: flow\ntheme: terminal"));
    expect([切替後.textMetrics, 記法で指定.textMetrics]).toEqual(["monospace", "monospace"]);
  });
});
