import { describe, it, expect } from "vitest";
import { fitBounds } from "./fit-bounds";

describe("画面に収める範囲", () => {
  const diagram = { width: 800, height: 600 };

  it("パーツが無ければ図の枠そのもの", () => {
    expect(fitBounds(diagram, 0, [])).toEqual({ left: 0, top: 0, width: 800, height: 600 });
  });

  it("見出しの高さを足す", () => {
    expect(fitBounds(diagram, 40, []).height).toBe(640);
  });

  it("図の下に出たパーツを含める", () => {
    const b = fitBounds(diagram, 0, [{ left: 100, top: 1000, width: 400, height: 300 }]);
    expect(b.height).toBe(1300);
    expect(b.top).toBe(0);
  });

  it("図の右に出たパーツを含める", () => {
    const b = fitBounds(diagram, 0, [{ left: 900, top: 0, width: 400, height: 300 }]);
    expect(b.width).toBe(1300);
  });

  it("図の左と上に出たパーツを含める (原点が負になる)", () => {
    const b = fitBounds(diagram, 0, [{ left: -200, top: -100, width: 300, height: 200 }]);
    expect(b.left).toBe(-200);
    expect(b.top).toBe(-100);
    expect(b.width).toBe(1000);
    expect(b.height).toBe(700);
  });

  it("図の中に収まるパーツは範囲を変えない", () => {
    const b = fitBounds(diagram, 0, [{ left: 100, top: 100, width: 200, height: 200 }]);
    expect(b).toEqual({ left: 0, top: 0, width: 800, height: 600 });
  });

  it("複数のパーツを全部含める", () => {
    const b = fitBounds(diagram, 0, [
      { left: -50, top: 0, width: 100, height: 100 },
      { left: 0, top: 900, width: 100, height: 100 },
    ]);
    expect(b.left).toBe(-50);
    expect(b.width).toBe(850);
    expect(b.height).toBe(1000);
  });

  it("大きさが 0 以下のパーツは数えない (範囲が壊れる)", () => {
    const b = fitBounds(diagram, 0, [{ left: -9999, top: -9999, width: 0, height: 0 }]);
    expect(b).toEqual({ left: 0, top: 0, width: 800, height: 600 });
  });

  it("数でない値は数えない", () => {
    const b = fitBounds(diagram, 0, [
      { left: Number.NaN, top: 0, width: 100, height: 100 },
      { left: 0, top: 0, width: Number.POSITIVE_INFINITY, height: 100 },
    ]);
    expect(b).toEqual({ left: 0, top: 0, width: 800, height: 600 });
  });

  it("幅と高さは 1 を下回らない (0 で割らない)", () => {
    const b = fitBounds({ width: 0, height: 0 }, 0, []);
    expect(b.width).toBeGreaterThanOrEqual(1);
    expect(b.height).toBeGreaterThanOrEqual(1);
  });
});
