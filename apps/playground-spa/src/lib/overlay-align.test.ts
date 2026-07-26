import { describe, it, expect } from "vitest";
import { alignOverlayParts, type AlignParts } from "./overlay-align";

const P = (id: string, posX: number, posY: number, w = 100, h = 100, scale = 1): AlignParts => ({ id, posX, posY, scale, width: w, height: h });

describe("alignOverlayParts", () => {
  it("2 個未満は変化なし", () => {
    expect(alignOverlayParts([], "left").size).toBe(0);
    expect(alignOverlayParts([P("a", 100, 200)], "left").size).toBe(0);
  });

  it("align left = 全 posX が min に揃う", () => {
    const r = alignOverlayParts([P("a", 100, 10), P("b", 300, 20), P("c", 200, 30)], "left");
    expect(r.get("a")!.posX).toBe(100);
    expect(r.get("b")!.posX).toBe(100);
    expect(r.get("c")!.posX).toBe(100);
    expect(r.get("a")!.posY).toBe(10);
    expect(r.get("b")!.posY).toBe(20);
    expect(r.get("c")!.posY).toBe(30);
  });

  it("align right = 全 posX + w が max に揃う", () => {
    const r = alignOverlayParts([P("a", 100, 10, 100), P("b", 300, 20, 50), P("c", 200, 30, 200)], "right");
    // maxR = max(200, 350, 400) = 400
    expect(r.get("a")!.posX).toBe(300); // 400 - 100
    expect(r.get("b")!.posX).toBe(350); // 400 - 50
    expect(r.get("c")!.posX).toBe(200); // 400 - 200
  });

  it("align center-h = 全中心 X が平均に揃う", () => {
    const r = alignOverlayParts([P("a", 100, 0, 100), P("b", 300, 0, 100)], "center-h");
    // avgCx = (150 + 350) / 2 = 250
    expect(r.get("a")!.posX).toBe(200); // 250 - 50
    expect(r.get("b")!.posX).toBe(200);
  });

  it("align top = 全 posY が min に揃う", () => {
    const r = alignOverlayParts([P("a", 0, 100), P("b", 0, 300), P("c", 0, 200)], "top");
    expect(r.get("a")!.posY).toBe(100);
    expect(r.get("b")!.posY).toBe(100);
    expect(r.get("c")!.posY).toBe(100);
  });

  it("align bottom = 全 posY + h が max に揃う", () => {
    const r = alignOverlayParts([P("a", 0, 100, 100, 100), P("b", 0, 300, 100, 50)], "bottom");
    // maxB = max(200, 350) = 350
    expect(r.get("a")!.posY).toBe(250);
    expect(r.get("b")!.posY).toBe(300);
  });

  it("distribute-h = 3+ で 均等 X 配置", () => {
    const r = alignOverlayParts([P("a", 0, 0), P("b", 500, 0), P("c", 100, 0)], "distribute-h");
    // sorted = [a(0), c(100), b(500)]、 first=0、 last=500、 spacing=(500-0)/2=250
    expect(r.get("a")!.posX).toBe(0);
    expect(r.get("c")!.posX).toBe(250);
    expect(r.get("b")!.posX).toBe(500);
  });

  it("distribute-h = 2 個以下 は変化なし", () => {
    const r = alignOverlayParts([P("a", 0, 0), P("b", 500, 0)], "distribute-h");
    expect(r.size).toBe(0);
  });

  it("distribute-v = 3+ で 均等 Y 配置", () => {
    const r = alignOverlayParts([P("a", 0, 0), P("b", 0, 300), P("c", 0, 600)], "distribute-v");
    expect(r.get("a")!.posY).toBe(0);
    expect(r.get("b")!.posY).toBe(300);
    expect(r.get("c")!.posY).toBe(600);
  });

  it("scale 反映 = right align で scale 済 width が max に揃う", () => {
    const r = alignOverlayParts([P("a", 0, 0, 100, 100, 1), P("b", 0, 0, 100, 100, 2)], "right");
    // aは posX=0 + 100*1 = 100、 b は 0 + 100*2 = 200 → maxR = 200
    // a の 新 posX = 200 - 100 = 100
    // b の 新 posX = 200 - 200 = 0
    expect(r.get("a")!.posX).toBe(100);
    expect(r.get("b")!.posX).toBe(0);
  });
});

describe("align が要素ごとの実幅を使う (CAR-2158 consistency detector)", () => {
  it("幅の異なる 2 要素を右揃えすると右端が一致する", () => {
    // 固定幅で計算する実装だと、 実幅が違う要素同士では右端が揃わない。
    // width を明示的に与えることで、 呼び出し側が実測値を渡しているかを分離して検証できる。
    const parts = [
      { id: "a", posX: 0, posY: 0, scale: 1, width: 100, height: 100 },
      { id: "b", posX: 0, posY: 200, scale: 1, width: 300, height: 100 },
    ];
    const result = alignOverlayParts(parts, "right");
    const rightA = (result.get("a")?.posX ?? parts[0]!.posX) + parts[0]!.width * parts[0]!.scale;
    const rightB = (result.get("b")?.posX ?? parts[1]!.posX) + parts[1]!.width * parts[1]!.scale;
    expect(Math.abs(rightA - rightB)).toBeLessThan(0.001);
  });

  it("scale が違う 2 要素でも実寸 (width * scale) で揃う", () => {
    const parts = [
      { id: "a", posX: 0, posY: 0, scale: 2, width: 100, height: 100 },
      { id: "b", posX: 0, posY: 200, scale: 1, width: 100, height: 100 },
    ];
    const result = alignOverlayParts(parts, "right");
    const rightA = (result.get("a")?.posX ?? 0) + 100 * 2;
    const rightB = (result.get("b")?.posX ?? 0) + 100 * 1;
    expect(Math.abs(rightA - rightB)).toBeLessThan(0.001);
  });

  it("center-h も実寸基準で中心が一致する", () => {
    const parts = [
      { id: "a", posX: 0, posY: 0, scale: 1, width: 100, height: 100 },
      { id: "b", posX: 0, posY: 200, scale: 1, width: 300, height: 100 },
    ];
    const result = alignOverlayParts(parts, "center-h");
    const centerA = (result.get("a")?.posX ?? 0) + 100 / 2;
    const centerB = (result.get("b")?.posX ?? 0) + 300 / 2;
    expect(Math.abs(centerA - centerB)).toBeLessThan(0.001);
  });
});
