import { describe, expect, it } from "vitest";

import {
  effectivePaint,
  parseColor,
  type Paint,
  type Rgb,
} from "../../tests/helpers/effective-color";
import { contrast } from "../../tests/helpers/pixel-contrast";

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

const paint = (overrides: Partial<Pick<Paint, "fill" | "fillOpacity" | "stroke" | "strokeOpacity" | "opacity">> = {}) => ({
  fill: "#ffffff",
  fillOpacity: 1,
  stroke: "#000000",
  strokeOpacity: 1,
  opacity: 1,
  ...overrides,
});

describe("実効色", () => {
  it("半分の濃さの黒い枠は白い地との中間色になる", () => {
    const result = effectivePaint(paint({ strokeOpacity: 0.5 }), WHITE);

    expect(result.face).toEqual(WHITE);
    expect(result.frame).toEqual([127.5, 127.5, 127.5]);
  });

  it("図面の半透明な枠と不透明な枠の実効対比を固定する", () => {
    const ground: Rgb = [0xe3, 0xe9, 0xea];
    const half = effectivePaint(paint({ fill: "#e3e9ea", stroke: "#143a52", strokeOpacity: 0.5 }), ground);
    const solid = effectivePaint(paint({ fill: "#e3e9ea", stroke: "#143a52" }), ground);

    expect(contrast(half.frame!, half.face)).toBeCloseTo(2.66, 2);
    expect(contrast(solid.frame!, solid.face)).toBeCloseTo(9.74, 2);
  });

  it("祖先を含む opacity は塗りと枠を一つの組として地へ重ねる", () => {
    const result = effectivePaint(paint({ fill: "#0000ff", stroke: "#ff0000", opacity: 0.5 }), WHITE);

    expect(result.face).toEqual([127.5, 127.5, 255]);
    expect(result.frame).toEqual([255, 127.5, 127.5]);
  });

  it("fill-opacity は面を同じ合成経路で地との中間色にする", () => {
    const result = effectivePaint(paint({ fill: "#000000", fillOpacity: 0.5 }), WHITE);

    expect(result.face).toEqual([127.5, 127.5, 127.5]);
  });

  it("枠の濃さと要素の opacity を先に掛け合わせない", () => {
    const result = effectivePaint(paint({ strokeOpacity: 0.5, opacity: 0.5 }), BLACK);

    expect(result.frame).toEqual([63.75, 63.75, 63.75]);
    expect(result.frame).not.toEqual([95.625, 95.625, 95.625]);
  });

  it("色自身の alpha と stroke-opacity は同じ濃さになる", () => {
    const colorAlpha = effectivePaint(paint({ stroke: "rgba(0, 0, 0, 0.5)" }), WHITE);
    const strokeAlpha = effectivePaint(paint({ strokeOpacity: 0.5 }), WHITE);

    expect(colorAlpha.frame).toEqual(strokeAlpha.frame);
  });

  it.each([
    ["none", null],
    ["transparent", { rgb: BLACK, alpha: 0 }],
    ["rgb(20 58 82 / 0.5)", { rgb: [20, 58, 82], alpha: 0.5 }],
    ["color(srgb 1 0.180392 0.592157 / 0.18)", { rgb: [255, 45.99996, 151.00003500000003], alpha: 0.18 }],
    ["#143a52", { rgb: [20, 58, 82], alpha: 1 }],
  ])("%s を読む", (value, expected) => {
    expect(parseColor(value)).toEqual(expected);
  });

  it("読めない色は理由を隠さず落とす", () => {
    expect(() => parseColor("url(#paint)")).toThrow("色として読めない: url(#paint)");
  });

  it("枠が none なら実効の枠を返さない", () => {
    expect(effectivePaint(paint({ stroke: "none" }), WHITE).frame).toBeNull();
  });
});
