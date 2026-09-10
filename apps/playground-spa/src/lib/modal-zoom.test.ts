/**
 * 拡大表示の倍率の検査 (#1745)。
 *
 * 画面を描かずに確かめられる形にしてあるので、ここでは刻みの動き方だけを固定する。
 * 実際に svg がその幅で描かれることは `tests/catalog-modal-zoom.spec.ts` が見る。
 */
import { describe, it, expect } from "vitest";
import { 倍率の刻み, 収める, 次の倍率, 端か, 倍率の表示, svgの幅 } from "./modal-zoom";

describe("拡大表示の倍率 (#1745)", () => {
  it("刻みが 1 つ以上あり、昇順で重複が無い (空振り防止)", () => {
    expect(倍率の刻み.length, "刻みが空 (検査が空振りしている)").toBeGreaterThan(0);
    expect([...倍率の刻み].sort((a, b) => a - b)).toEqual([...倍率の刻み]);
    expect(new Set(倍率の刻み).size).toBe(倍率の刻み.length);
  });

  it("実寸 (1 倍) が刻みに入っている", () => {
    // `収める` からの起点なので、無いと押した時の行き先が決まらない
    expect(倍率の刻み).toContain(1);
  });

  it("`収める` から上げると、実寸の 1 つ上へ行く", () => {
    const 実寸の上 = 倍率の刻み[倍率の刻み.indexOf(1) + 1];
    expect(次の倍率(収める, "上げる")).toBe(実寸の上);
  });

  it("`収める` から下げると、実寸の 1 つ下へ行く", () => {
    const 実寸の下 = 倍率の刻み[倍率の刻み.indexOf(1) - 1];
    expect(次の倍率(収める, "下げる")).toBe(実寸の下);
  });

  it("刻みを 1 つずつ辿れる", () => {
    const 上り: number[] = [];
    let いま = 倍率の刻み[0]!;
    for (let i = 0; i < 倍率の刻み.length + 2; i += 1) {
      上り.push(いま);
      いま = 次の倍率(いま, "上げる") as number;
    }
    // 端に着いたら同じ値が続く = 一意にすると刻みそのものになる
    expect([...new Set(上り)]).toEqual([...倍率の刻み]);
  });

  it("端では動かない", () => {
    const 下端 = 倍率の刻み[0]!;
    const 上端 = 倍率の刻み[倍率の刻み.length - 1]!;
    expect(次の倍率(下端, "下げる")).toBe(下端);
    expect(次の倍率(上端, "上げる")).toBe(上端);
    expect(端か(下端, "下げる")).toBe(true);
    expect(端か(上端, "上げる")).toBe(true);
    // 反対向きには動く = `端か` が何にでも true を返す形ではない
    expect(端か(下端, "上げる")).toBe(false);
    expect(端か(上端, "下げる")).toBe(false);
  });

  it("刻みに無い倍率を渡されたら実寸へ戻す", () => {
    // 状態が壊れた時に押しても動かなくなるのを避ける
    expect(次の倍率(0.31, "上げる")).toBe(1);
    expect(次の倍率(0.31, "下げる")).toBe(1);
  });

  it("表示は `収める` か百分率", () => {
    expect(倍率の表示(収める)).toBe("収める");
    expect(倍率の表示(1)).toBe("100%");
    expect(倍率の表示(0.75)).toBe("75%");
    expect(倍率の表示(3)).toBe("300%");
  });

  it("svg の幅は viewBox の幅 × 倍率", () => {
    expect(svgの幅(1, 2190)).toBe(2190);
    expect(svgの幅(2, 2190)).toBe(4380);
    expect(svgの幅(0.5, 2190)).toBe(1095);
  });

  it("`収める` と、幅を出せない時は幅を返さない (0 に潰さない)", () => {
    expect(svgの幅(収める, 2190)).toBeUndefined();
    for (const 幅 of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, undefined]) {
      expect(svgの幅(1, 幅), `幅 ${String(幅)} で undefined 以外が返る`).toBeUndefined();
    }
  });
});
