// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  readableFloorScale,
  applyReadableFloor,
  smallestFontWorld,
  READABLE_MIN_PX,
  READABLE_MAX_SCALE,
} from "./readable-scale";

describe("readableFloorScale", () => {
  it("世界座標の文字が大きいほど下限は低い", () => {
    // 見本「Client登録」 の実測値 (最小文字 20 世界座標、 図の倍率 1)
    expect(readableFloorScale(20, 1)).toBeCloseTo(0.5, 5);
    // 文字を大きく持つ図はもっと縮めても読める
    expect(readableFloorScale(40, 1)).toBeCloseTo(0.25, 5);
  });

  it("図そのものの倍率を掛けた後の大きさで判定する", () => {
    // 記法で 2 倍にした図は、 表示倍率が半分でも同じ見え方になる
    expect(readableFloorScale(20, 2)).toBeCloseTo(0.25, 5);
  });

  it("下限の px は差し替えられる", () => {
    expect(readableFloorScale(20, 1, 20)).toBeCloseTo(1, 5);
  });

  it("測れない時は下限を課さない", () => {
    for (const v of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(readableFloorScale(v, 1), `minFontWorld=${v}`).toBe(0);
      expect(readableFloorScale(20, v), `diagramK=${v}`).toBe(0);
      expect(readableFloorScale(20, 1, v), `minPx=${v}`).toBe(0);
    }
  });

  it("既定の下限は 10px", () => {
    expect(READABLE_MIN_PX).toBe(10);
    expect(readableFloorScale(20, 1)).toBe(readableFloorScale(20, 1, 10));
  });
});

describe("applyReadableFloor", () => {
  it("収める倍率が下限を下回るなら下限を採る", () => {
    // 見本「Client登録」 = 収める 0.23 に対し下限 0.5
    expect(applyReadableFloor(0.23, 0.5)).toBeCloseTo(0.5, 5);
  });

  it("収める倍率が下限より大きいならそのまま", () => {
    // 縦長の図はここに落ちる (見本「トリガー」 = 収める 0.6 / 下限 0.45)
    expect(applyReadableFloor(0.6, 0.45)).toBeCloseTo(0.6, 5);
  });

  it("下限は 100% で頭打ちにする", () => {
    // 文字を極端に小さく持つ図で下限が 2.0 になっても、 実寸より膨らませない
    expect(applyReadableFloor(0.3, 2)).toBeCloseTo(1, 5);
    expect(READABLE_MAX_SCALE).toBe(1);
  });

  it("頭打ちは下限にだけ効き、 収める倍率は下げない", () => {
    // 小さい図が 150% で収まる形。 上限で 1 に下げると、 直そうとしていない図が縮む
    expect(applyReadableFloor(1.5, 0.4)).toBeCloseTo(1.5, 5);
  });

  it("下限が無い (測れなかった) 時は収める倍率のまま", () => {
    expect(applyReadableFloor(0.23, 0)).toBeCloseTo(0.23, 5);
  });

  it("収める倍率が壊れている時は触らない", () => {
    expect(applyReadableFloor(Number.NaN, 0.5)).toBeNaN();
    expect(applyReadableFloor(0, 0.5)).toBe(0);
  });

  it("上限は差し替えられる", () => {
    expect(applyReadableFloor(0.3, 2, 1.5)).toBeCloseTo(1.5, 5);
  });
});

describe("smallestFontWorld", () => {
  const svgWith = (html: string): SVGSVGElement => {
    const host = document.createElement("div");
    host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`;
    return host.querySelector("svg")!;
  };

  it("最も小さい文字を返す", () => {
    const svg = svgWith(
      `<text font-size="24">大</text><text font-size="11">小</text><text font-size="17">中</text>`,
    );
    expect(smallestFontWorld(svg)).toBe(11);
  });

  it("CSS で決まっている図でも拾う", () => {
    const svg = svgWith(`<text style="font-size: 13px">CSS</text>`);
    expect(smallestFontWorld(svg)).toBe(13);
  });

  it("中身の無い文字は数えない", () => {
    // 位置合わせのための空 text を数えると、 読めない文字が実在しないのに下限が上がる
    const svg = svgWith(`<text font-size="4"></text><text font-size="20">あ</text>`);
    expect(smallestFontWorld(svg)).toBe(20);
  });

  it("大きさが読めない文字は数えない", () => {
    const svg = svgWith(`<text font-size="none">壊</text><text font-size="18">正</text>`);
    expect(smallestFontWorld(svg)).toBe(18);
  });

  it("文字が 1 つも無ければ 0 (下限を課さない)", () => {
    expect(smallestFontWorld(svgWith(`<rect width="10" height="10" />`))).toBe(0);
    expect(smallestFontWorld(null)).toBe(0);
    expect(smallestFontWorld(undefined)).toBe(0);
  });
});
