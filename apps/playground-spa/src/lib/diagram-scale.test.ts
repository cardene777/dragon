import { describe, it, expect } from "vitest";
import {
  readDiagramScale,
  setDiagramScale,
  clampDiagramScale,
  clampFontScale,
  MIN_DIAGRAM_SCALE,
  MAX_DIAGRAM_SCALE,
} from "./diagram-scale";

const base = `title: "T"
type: sequence
actors:
  - Client
  - API
flow:
  - Client -> API: "req"
`;

describe("clampDiagramScale", () => {
  it("下限 / 上限に丸める", () => {
    expect(clampDiagramScale(0.01)).toBe(MIN_DIAGRAM_SCALE);
    expect(clampDiagramScale(99)).toBe(MAX_DIAGRAM_SCALE);
    expect(clampDiagramScale(1.5)).toBe(1.5);
  });

  it("不正値は 1", () => {
    expect(clampDiagramScale(NaN)).toBe(1);
    expect(clampDiagramScale(0)).toBe(1);
    expect(clampDiagramScale(-3)).toBe(1);
  });

  it("下限は 0.5 以上を保つ (潰れて読めなくなるのを防ぐ)", () => {
    expect(MIN_DIAGRAM_SCALE).toBeGreaterThanOrEqual(0.5);
  });
});

describe("setDiagramScale", () => {
  it("viewport が無ければ type の直後に作る", () => {
    const out = setDiagramScale(base, 1.5);
    expect(out).toContain("viewport: { scale: 1.5 }");
    // actors より前にある
    expect(out.indexOf("viewport:")).toBeLessThan(out.indexOf("actors:"));
    expect(out.indexOf("type:")).toBeLessThan(out.indexOf("viewport:"));
  });

  it("既存 viewport の他 field を保持して scale だけ足す", () => {
    const src = 'title: "T"\ntype: sequence\nviewport: { laneGap: 300 }\nactors:\n  - Client\n';
    const out = setDiagramScale(src, 2);
    expect(out).toContain("laneGap: 300");
    expect(out).toContain("scale: 2");
  });

  it("既存 scale を置換する (重複しない)", () => {
    const out = setDiagramScale(setDiagramScale(base, 1.5), 2);
    expect(out.match(/scale:/g)).toHaveLength(1);
    expect(out).toContain("scale: 2");
  });

  it("倍率 1 では scale を消す", () => {
    const out = setDiagramScale(setDiagramScale(base, 1.5), 1);
    expect(out).not.toContain("scale:");
  });

  it("倍率 1 で viewport が空になれば行ごと消す", () => {
    const out = setDiagramScale(setDiagramScale(base, 1.5), 1);
    expect(out).not.toContain("viewport:");
    expect(out).toBe(base);
  });

  it("倍率 1 でも他 field が残るなら viewport 行は残す", () => {
    const src = 'title: "T"\ntype: sequence\nviewport: { laneGap: 300, scale: 2 }\nactors:\n  - Client\n';
    const out = setDiagramScale(src, 1);
    expect(out).toContain("viewport: { laneGap: 300 }");
  });

  it("上限を超える指定は丸める", () => {
    expect(setDiagramScale(base, 99)).toContain(`scale: ${MAX_DIAGRAM_SCALE}`);
  });

  it("CRLF の DSL で行末が混在しない", () => {
    const src = 'title: "T"\r\ntype: sequence\r\nactors:\r\n  - Client\r\n';
    const out = setDiagramScale(src, 1.5);
    expect(out.match(/(?<!\r)\n/)).toBeNull();
  });

  it("viewport が無く type も無ければ先頭に足す", () => {
    const out = setDiagramScale("actors:\n  - Client\n", 1.5);
    expect(out.startsWith("viewport: { scale: 1.5 }")).toBe(true);
  });
});

describe("readDiagramScale", () => {
  it("viewport が無ければ 1", () => {
    expect(readDiagramScale(base)).toBe(1);
  });

  it("scale が無ければ 1", () => {
    expect(readDiagramScale('type: sequence\nviewport: { laneGap: 300 }\n')).toBe(1);
  });

  it("書いた値を読み戻せる", () => {
    expect(readDiagramScale(setDiagramScale(base, 1.5))).toBe(1.5);
    expect(readDiagramScale(setDiagramScale(base, 0.5))).toBe(0.5);
  });

  it("他 field と混在していても読める", () => {
    expect(readDiagramScale('type: sequence\nviewport: { laneGap: 300, scale: 2, nodeGap: 40 }\n')).toBe(2);
  });

  it("範囲外の値は丸めて返す", () => {
    expect(readDiagramScale('type: sequence\nviewport: { scale: 99 }\n')).toBe(MAX_DIAGRAM_SCALE);
  });

  it("数値でなければ 1", () => {
    expect(readDiagramScale('type: sequence\nviewport: { scale: abc }\n')).toBe(1);
  });

  it("往復しても値が変わらない (拡大を繰り返しても壊れない)", () => {
    let src = base;
    for (let i = 0; i < 3; i += 1) src = setDiagramScale(src, readDiagramScale(src) * 1.25);
    expect(readDiagramScale(src)).toBeCloseTo(1.953, 2);
    expect(src.match(/scale:/g)).toHaveLength(1);
  });
});

describe("clampFontScale", () => {
  it("下限 / 上限に丸める", () => {
    expect(clampFontScale(0.1)).toBe(0.6);
    expect(clampFontScale(99)).toBe(2.5);
    expect(clampFontScale(1.2)).toBe(1.2);
  });

  it("不正値は 1", () => {
    expect(clampFontScale(NaN)).toBe(1);
    expect(clampFontScale(-1)).toBe(1);
  });
});
