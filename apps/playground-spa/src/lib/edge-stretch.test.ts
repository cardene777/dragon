import { describe, it, expect } from "vitest";
import { parsePathD, serializePathD, shiftPathEnd, edgeSideFor } from "./edge-stretch";

describe("parsePathD", () => {
  it("絶対 command を分解する", () => {
    expect(parsePathD("M 10 20 L 30 40")).toEqual([
      { cmd: "M", nums: [10, 20] },
      { cmd: "L", nums: [30, 40] },
    ]);
  });

  it("小数 / 負値 / 指数表記を読む", () => {
    expect(parsePathD("M -1.5 2e2 L 3.25 -4")).toEqual([
      { cmd: "M", nums: [-1.5, 200] },
      { cmd: "L", nums: [3.25, -4] },
    ]);
  });

  it("カンマ区切りでも読む", () => {
    expect(parsePathD("M10,20L30,40")).toEqual([
      { cmd: "M", nums: [10, 20] },
      { cmd: "L", nums: [30, 40] },
    ]);
  });

  it("相対 command は諦める (端点の意味が変わるため)", () => {
    expect(parsePathD("m 10 20 l 30 40")).toBeNull();
  });

  it("空文字は null", () => {
    expect(parsePathD("")).toBeNull();
  });

  it("解釈できない文字が残ったら null", () => {
    expect(parsePathD("M 10 20 ??? 5")).toBeNull();
  });

  it("往復して同じ形になる", () => {
    const d = "M 10 20 C 1 2 3 4 5 6 L 7 8";
    expect(serializePathD(parsePathD(d)!)).toBe(d);
  });
});

describe("shiftPathEnd", () => {
  it("始点だけを動かす (直線が伸びる)", () => {
    expect(shiftPathEnd("M 100 50 L 400 50", "start", 30, 0)).toBe("M 130 50 L 400 50");
  });

  it("終点だけを動かす", () => {
    expect(shiftPathEnd("M 100 50 L 400 50", "end", -25, 0)).toBe("M 100 50 L 375 50");
  });

  it("both は全座標を動かす (自己ループ等)", () => {
    expect(shiftPathEnd("M 100 50 L 400 50", "both", 10, 5)).toBe("M 110 55 L 410 55");
  });

  it("曲線の端点だけ動かし、 制御点は据え置く", () => {
    // C の末尾 2 つが終点、 前 4 つは制御点
    expect(shiftPathEnd("M 0 0 C 10 10 20 20 30 30", "end", 5, 0)).toBe("M 0 0 C 10 10 20 20 35 30");
  });

  it("曲線の始点側は M だけ動く", () => {
    expect(shiftPathEnd("M 0 0 C 10 10 20 20 30 30", "start", 5, 0)).toBe("M 5 0 C 10 10 20 20 30 30");
  });

  it("複数 segment でも端だけ動かす", () => {
    expect(shiftPathEnd("M 0 0 L 10 0 L 20 0", "end", 7, 0)).toBe("M 0 0 L 10 0 L 27 0");
    expect(shiftPathEnd("M 0 0 L 10 0 L 20 0", "start", 7, 0)).toBe("M 7 0 L 10 0 L 20 0");
  });

  it("A (円弧) は末尾の座標だけ動かす", () => {
    expect(shiftPathEnd("M 0 0 A 5 5 0 0 1 10 10", "end", 3, 0)).toBe("M 0 0 A 5 5 0 0 1 13 10");
  });

  it("Z 終端では end を動かせず null", () => {
    expect(shiftPathEnd("M 0 0 L 10 0 Z", "end", 5, 0)).toBeNull();
  });

  it("解釈できない d は null (壊れた path を書かない)", () => {
    expect(shiftPathEnd("m 0 0 l 10 0", "start", 5, 0)).toBeNull();
  });

  it("縦方向にも動く", () => {
    expect(shiftPathEnd("M 0 0 L 0 100", "end", 0, 20)).toBe("M 0 0 L 0 120");
  });

  it("小数は 3 桁に丸める", () => {
    expect(shiftPathEnd("M 0 0 L 10 0", "end", 0.12345, 0)).toBe("M 0 0 L 10.123 0");
  });
});

describe("edgeSideFor", () => {
  // sequence の edge は `data-cdl-from="s0-client"` のように node id が入る。
  // 素の actor 名比較では一度も一致しない (実測)。
  it("step box id (s{N}-{slug}) で始点側を判定する", () => {
    expect(edgeSideFor("s0-client", "s0-api", "Client", "client")).toBe("start");
  });

  it("step box id で終点側を判定する", () => {
    expect(edgeSideFor("s0-client", "s0-api", "API", "api")).toBe("end");
  });

  it("両端が同じ actor なら both", () => {
    expect(edgeSideFor("s0-client", "s1-client", "Client", "client")).toBe("both");
  });

  it("suffix 形式 ({slug}-header) も拾う", () => {
    expect(edgeSideFor("client-header", "api-header", "Client", "client")).toBe("start");
  });

  it("parts merge 形式 ({slug}__x) も拾う", () => {
    expect(edgeSideFor("client__ring", "api-header", "Client", "client")).toBe("start");
  });

  it("slug 完全一致も拾う", () => {
    expect(edgeSideFor("client", "api", "Client", "client")).toBe("start");
  });

  it("無関係な edge は null", () => {
    expect(edgeSideFor("s0-api", "s0-db", "Client", "client")).toBeNull();
  });

  it("prefix が部分一致するだけの別 actor を誤検出しない", () => {
    // `clientele` は `client` で始まるが別 actor
    expect(edgeSideFor("s0-clientele", "s0-api", "Client", "client")).toBeNull();
  });

  it("slug が空 (日本語のみ) でも生名で判定する", () => {
    expect(edgeSideFor("s0-ユーザー", "s0-api", "ユーザー", "")).toBe("start");
  });
});
