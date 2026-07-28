import { describe, it, expect } from "vitest";
import { readSvgScaleAttr, scaledPixelSize, applySvgPixelSize, normalizeScale } from "./svg-pixel-size";

const svg = (v: string | null) => ({ getAttribute: () => v });

/** `setProperty` の呼び出しを記録するだけの SVG 代役。 */
function fakeSvg(scaleAttr: string | null) {
  const calls: Array<[string, string, string]> = [];
  return {
    calls,
    el: {
      getAttribute: () => scaleAttr,
      style: {
        setProperty: (name: string, value: string, priority?: string) => {
          calls.push([name, value, priority ?? ""]);
        },
      },
    } as unknown as SVGSVGElement,
  };
}

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

describe("normalizeScale", () => {
  it("cdl と同じ規則で丸める", () => {
    expect(normalizeScale(undefined)).toBe(1);
    expect(normalizeScale(null)).toBe(1);
    expect(normalizeScale(1.25)).toBe(1.25);
    expect(normalizeScale(100)).toBe(8);
    expect(normalizeScale(0.001)).toBe(0.125);
    for (const bad of [0, -1, NaN, Infinity]) {
      expect(normalizeScale(bad), String(bad)).toBe(1);
    }
  });
});

describe("applySvgPixelSize", () => {
  it("幅 / 高さ / max-width を important 付きで焼き込む", () => {
    const { calls, el } = fakeSvg(null);
    applySvgPixelSize(el, { width: 800, height: 400 });
    expect(calls).toEqual([
      ["width", "800px", "important"],
      ["height", "400px", "important"],
      ["max-width", "none", "important"],
    ]);
  });

  it("important を必ず付ける", () => {
    // `editor.css` の `.v4-editor-svg-wrap svg` が `width: var(--cdl-svg-w, 800px) !important`
    // を持つ。 important を落とすと stylesheet 側が勝ち、 図が 800x600 に潰れる。
    const { calls, el } = fakeSvg("2");
    applySvgPixelSize(el, { width: 100, height: 50 });
    for (const [name, , priority] of calls) {
      expect(priority, name).toBe("important");
    }
  });

  it("倍率を掛けた値を焼き込む", () => {
    const { calls, el } = fakeSvg("1.5");
    const out = applySvgPixelSize(el, { width: 800, height: 400 });
    expect(out).toEqual({ w: 1200, h: 600 });
    expect(calls[0]).toEqual(["width", "1200px", "important"]);
    expect(calls[1]).toEqual(["height", "600px", "important"]);
  });

  it("倍率が無ければ viewBox 実寸をそのまま焼き込む", () => {
    const { el } = fakeSvg(null);
    expect(applySvgPixelSize(el, { width: 1769.12, height: 1032 })).toEqual({ w: 1769.12, h: 1032 });
  });
});
