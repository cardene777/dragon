import { describe, it, expect } from "vitest";
import { readSvgScaleAttr, scaledPixelSize } from "./svg-pixel-size";

const svg = (v: string | null) => ({ getAttribute: () => v });

describe("readSvgScaleAttr", () => {
  it("属性が無ければ 1", () => {
    expect(readSvgScaleAttr(svg(null))).toBe(1);
  });

  it("空文字 / 空白のみは 1", () => {
    expect(readSvgScaleAttr(svg(""))).toBe(1);
    expect(readSvgScaleAttr(svg("   "))).toBe(1);
  });

  it("数値をそのまま読む", () => {
    expect(readSvgScaleAttr(svg("1.25"))).toBe(1.25);
    expect(readSvgScaleAttr(svg("3"))).toBe(3);
    expect(readSvgScaleAttr(svg("0.5"))).toBe(0.5);
  });

  it("上限 8 / 下限 0.125 に丸める", () => {
    expect(readSvgScaleAttr(svg("100"))).toBe(8);
    expect(readSvgScaleAttr(svg("0.001"))).toBe(0.125);
  });

  it("0 / 負値 / 数値でない文字列は 1", () => {
    for (const bad of ["0", "-2", "abc", "NaN", "Infinity", "1.5x"]) {
      expect(readSvgScaleAttr(svg(bad)), bad).toBe(1);
    }
  });
});

describe("scaledPixelSize", () => {
  it("viewBox 実寸に倍率を掛ける", () => {
    expect(scaledPixelSize({ width: 800, height: 400 }, 1)).toEqual({ w: 800, h: 400 });
    expect(scaledPixelSize({ width: 800, height: 400 }, 1.25)).toEqual({ w: 1000, h: 500 });
    expect(scaledPixelSize({ width: 800, height: 400 }, 0.5)).toEqual({ w: 400, h: 200 });
  });

  it("縦横比を保つ", () => {
    const vb = { width: 1769.12, height: 1032 };
    for (const k of [0.5, 1.25, 3, 8]) {
      const p = scaledPixelSize(vb, k);
      expect(p.w / p.h).toBeCloseTo(vb.width / vb.height, 10);
    }
  });
});
