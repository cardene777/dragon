import { describe, it, expect } from "vitest";
import { panCompensation, screenX } from "./viewbox-anchor";

describe("panCompensation", () => {
  it("初回 (前の枠が無い) は補正しない", () => {
    expect(panCompensation(null, { x: 0, y: 0, k: 1 }, 0.5)).toBeNull();
  });

  it("枠が動いていなければ補正しない", () => {
    expect(panCompensation({ x: 10, y: 20, k: 1 }, { x: 10, y: 20, k: 1 }, 0.5)).toBeNull();
  });

  it("倍率が変わった回は補正しない", () => {
    // 拡大縮小そのものが画面を変える操作なので、 打ち消すと倍率が効かなくなる
    expect(panCompensation({ x: -44, y: -24, k: 1 }, { x: -44, y: -24, k: 1.25 }, 0.4)).toBeNull();
    expect(panCompensation({ x: -44, y: -24, k: 1 }, { x: 100, y: -24, k: 1.25 }, 0.4)).toBeNull();
  });

  it("枠が動いた分を pan の拡大率込みで返す", () => {
    const out = panCompensation({ x: -44, y: -24, k: 1 }, { x: 239, y: -24, k: 1 }, 0.4065);
    expect(out).not.toBeNull();
    expect(out!.dtx).toBeCloseTo(0.4065 * 283, 6);
    expect(out!.dty).toBe(0);
  });

  it("倍率が 1 以外なら倍率も掛ける", () => {
    const out = panCompensation({ x: 0, y: 0, k: 2 }, { x: 100, y: 50, k: 2 }, 0.5);
    expect(out!.dtx).toBeCloseTo(0.5 * 2 * 100, 6);
    expect(out!.dty).toBeCloseTo(0.5 * 2 * 50, 6);
  });

  it("pan が 0 / 負値 / 非数なら補正しない", () => {
    for (const bad of [0, -1, NaN, Infinity]) {
      expect(panCompensation({ x: 0, y: 0, k: 1 }, { x: 10, y: 0, k: 1 }, bad), String(bad)).toBeNull();
    }
  });
});

describe("補正すると触っていない要素が画面に留まる", () => {
  // 実測値。 sequence の既定 sample で client を右へ drag した時の枠の変化。
  const PAN = 0.4065;
  const K = 1;
  const before = { x: -44, k: K };
  const after = { x: 239, k: K };
  const TX = 0;

  const comp = panCompensation({ ...before, y: 0 }, { ...after, y: 0 }, PAN)!;

  it("動かしていない要素の画面位置が変わらない", () => {
    // 右側の actor は user 座標が変わらない
    const p = 900;
    const s0 = screenX(TX, PAN, K, before.x, p);
    const s1 = screenX(TX + comp.dtx, PAN, K, after.x, p);
    expect(s1).toBeCloseTo(s0, 6);
  });

  it("動かした要素だけが動く", () => {
    // client は user 座標 170 → 453 (drag で +283)
    const s0 = screenX(TX, PAN, K, before.x, 170);
    const s1 = screenX(TX + comp.dtx, PAN, K, after.x, 453);
    expect(s1 - s0).toBeCloseTo(PAN * 283, 6);
  });

  it("補正しないと動かした要素が画面上で動かない (欠陥の再現)", () => {
    const s0 = screenX(TX, PAN, K, before.x, 170);
    const s1 = screenX(TX, PAN, K, after.x, 453);
    expect(s1 - s0).toBeCloseTo(0, 6);
  });

  it("補正しないと触っていない要素の方が動いてしまう", () => {
    const s0 = screenX(TX, PAN, K, before.x, 900);
    const s1 = screenX(TX, PAN, K, after.x, 900);
    expect(Math.abs(s1 - s0)).toBeGreaterThan(50);
  });
});
