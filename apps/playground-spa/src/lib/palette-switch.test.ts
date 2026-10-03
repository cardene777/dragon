import { describe, expect, it } from "vitest";
import { THEMES } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

import {
  図の配色を変える,
  配色の選択肢,
  押される配色,
  画面の色,
} from "./palette-switch";

const 図 = (palette?: string): CdlDiagram => ({
  id: "t",
  topic: "t",
  lanes: [],
  nodes: [],
  edges: [],
  states: [],
  phases: [],
  ...(palette === undefined ? {} : { palette }),
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

  it("未選択の押された札は図の意匠に従い、意匠が無ければ画面の色になる", () => {
    expect(押される配色(図("blueprint"), null)).toBe("blueprint");
    expect(押される配色(図(), null)).toBe(画面の色);
    expect(押される配色(図("kinari"), "celadon")).toBe("celadon");
  });
});
