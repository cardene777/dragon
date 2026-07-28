import { describe, it, expect } from "vitest";
import { scaledPixelSize, applySvgPixelSize, normalizeScale } from "./svg-pixel-size";

/** `setProperty` の呼び出しを記録するだけの SVG 代役。 */
function fakeSvg() {
  const calls: Array<[string, string, string]> = [];
  return {
    calls,
    el: {
      style: {
        setProperty: (name: string, value: string, priority?: string) => {
          calls.push([name, value, priority ?? ""]);
        },
      },
    } as unknown as SVGSVGElement,
  };
}

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
    const { calls, el } = fakeSvg();
    applySvgPixelSize(el, { width: 800, height: 400 }, 1);
    expect(calls).toEqual([
      ["width", "800px", "important"],
      ["height", "400px", "important"],
      ["max-width", "none", "important"],
    ]);
  });

  it("important を必ず付ける", () => {
    // `editor.css` の `.v4-editor-svg-wrap svg` が `width: var(--cdl-svg-w, 800px) !important`
    // を持つ。 important を落とすと stylesheet 側が勝ち、 図が 800x600 に潰れる。
    const { calls, el } = fakeSvg();
    applySvgPixelSize(el, { width: 100, height: 50 }, 2);
    for (const [name, , priority] of calls) {
      expect(priority, name).toBe("important");
    }
  });

  it("倍率を掛けた値を焼き込む", () => {
    const { calls, el } = fakeSvg();
    const out = applySvgPixelSize(el, { width: 800, height: 400 }, 1.5);
    expect(out).toEqual({ w: 1200, h: 600 });
    expect(calls[0]).toEqual(["width", "1200px", "important"]);
    expect(calls[1]).toEqual(["height", "600px", "important"]);
  });

  it("倍率 1 なら viewBox 実寸をそのまま焼き込む", () => {
    const { el } = fakeSvg();
    expect(applySvgPixelSize(el, { width: 1769.12, height: 1032 }, 1)).toEqual({ w: 1769.12, h: 1032 });
  });

  it("渡された倍率も同じ規則で丸める", () => {
    // 呼び出し側が丸め忘れても、 描画に使われるのと同じ範囲に収まる
    const { el } = fakeSvg();
    expect(applySvgPixelSize(el, { width: 100, height: 100 }, 100)).toEqual({ w: 800, h: 800 });
    expect(applySvgPixelSize(el, { width: 100, height: 100 }, 0)).toEqual({ w: 100, h: 100 });
    expect(applySvgPixelSize(el, { width: 100, height: 100 }, NaN)).toEqual({ w: 100, h: 100 });
  });
});
