import { describe, it, expect } from "vitest";
import { axisOffset, overflowsAxis } from "./fit-anchor";

describe("axisOffset", () => {
  it("収まるなら中央に置く", () => {
    // 枠 688 に図 322 → 左右に 183 ずつ余る
    expect(axisOffset({ frame: 688, content: 322, origin: 0 })).toBeCloseTo(183, 5);
  });

  it("収まらないなら始点を枠の左端に合わせる", () => {
    // 枠 688 に図 1374 (見本「Client登録」 の実測)。 中央だと左右 343 ずつ隠れる
    expect(axisOffset({ frame: 688, content: 1374, origin: 0 })).toBeCloseTo(0, 5);
  });

  it("囲んだ範囲の始点が負でも左端に合わせる", () => {
    // 図の左にパーツを置いた形。 `origin` の分だけ戻さないと左端がずれる
    expect(axisOffset({ frame: 688, content: 1374, origin: -120 })).toBe(120);
  });

  it("収まる時も囲んだ範囲の始点を戻す", () => {
    expect(axisOffset({ frame: 688, content: 322, origin: -40 })).toBeCloseTo(223, 5);
  });

  it("ちょうど同じ大きさは収まる側に入れる", () => {
    // 中央に置いても始点に寄せても結果は同じ (どちらも 0)
    expect(axisOffset({ frame: 688, content: 688, origin: 0 })).toBe(0);
  });

  it("値が壊れている時は動かさない", () => {
    for (const v of [Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(axisOffset({ frame: v, content: 322, origin: 0 }), `frame=${v}`).toBe(0);
      expect(axisOffset({ frame: 688, content: v, origin: 0 }), `content=${v}`).toBe(0);
      expect(axisOffset({ frame: 688, content: 322, origin: v }), `origin=${v}`).toBe(0);
    }
  });
});

describe("overflowsAxis", () => {
  it("図が枠より大きければ収まらない", () => {
    expect(overflowsAxis({ frame: 688, content: 1374, origin: 0 })).toBe(true);
  });

  it("図が枠以下なら収まる", () => {
    expect(overflowsAxis({ frame: 688, content: 688, origin: 0 })).toBe(false);
    expect(overflowsAxis({ frame: 688, content: 322, origin: 0 })).toBe(false);
  });

  it("値が壊れている時は収まる扱い", () => {
    // 判定できないことを理由に「収まらない」 に倒すと、 位置決めが始点寄せへ落ちる
    expect(overflowsAxis({ frame: Number.NaN, content: 1374, origin: 0 })).toBe(false);
  });
});
