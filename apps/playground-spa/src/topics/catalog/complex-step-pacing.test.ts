import { describe, expect, it } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import {
  presetClassComplex,
  presetClassDiagram,
  presetEr,
  presetErComplex,
} from "./presets.cdl";

const 関係の識別子 = /^(?:cr|rel)-\d+-/;
const 一段の最大増分 = 4;
const 複雑見本の最大段数 = 10;

type 見本 = Pick<CdlDiagram, "id" | "phases">;

/**
 * `activate` は累積値なので、前段との差だけを見ると一度に読む量を測れる。
 */
const 段ごとの増分 = (段: readonly Pick<CdlDiagram["phases"][number], "activate">[]): string[][] =>
  段.map((現在の段, 段番号) => {
    const 前段までに光った要素 = new Set(段[段番号 - 1]?.activate ?? []);
    return 現在の段.activate.filter((要素) => !前段までに光った要素.has(要素));
  });

const 見本たち: readonly 見本[] = [presetClassDiagram, presetClassComplex, presetEr, presetErComplex];
const 複雑見本たち = 見本たち.filter(
  (見本) => 見本.id === "class-complex-demo" || 見本.id === "er-complex-demo",
);

describe("複雑なカタログの段の進み方 (#1599)", () => {
  it("4 見本すべてのどの段も増分が 4 件以下である", () => {
    for (const 見本 of 見本たち) {
      for (const [段番号, 増分] of 段ごとの増分(見本.phases).entries()) {
        expect(増分.length, `${見本.id} の ${段番号 + 1} 段目の増分が ${増分.length} 件`).toBeLessThanOrEqual(
          一段の最大増分,
        );
      }
    }
  });

  it("複雑な 2 見本の 2 段目には関係が 1 本以上ある", () => {
    for (const 見本 of 複雑見本たち) {
      const 二段目の関係 = (段ごとの増分(見本.phases)[1] ?? []).filter((要素) => 関係の識別子.test(要素));
      expect(二段目の関係.length, `${見本.id} の 2 段目の関係が ${二段目の関係.length} 本`).toBeGreaterThanOrEqual(1);
    }
  });

  it("複雑な 2 見本の段数は 10 以下である", () => {
    for (const 見本 of 複雑見本たち) {
      expect(見本.phases.length, `${見本.id} の段数が ${見本.phases.length} 段`).toBeLessThanOrEqual(複雑見本の最大段数);
    }
  });

  it("走査できた見本が 4 件ちょうどである", () => {
    expect(見本たち.length, `走査できた見本が ${見本たち.length} 件で、検査が空振りしている`).toBe(4);
    expect(
      new Set(見本たち.map((見本) => 見本.id)),
      "走査できた見本の識別子が実物と一致せず、検査が空振りしている",
    ).toEqual(new Set(["class-demo", "class-complex-demo", "er-demo", "er-complex-demo"]));
    expect(
      複雑見本たち.length,
      `走査できた複雑な見本が ${複雑見本たち.length} 件で、検査が空振りしている`,
    ).toBe(2);
  });

  it("段ごとの増分を累積した activate から数えられる", () => {
    const 手組みの段 = [
      { activate: ["a"] },
      { activate: ["a", "b", "c"] },
      { activate: ["a", "b", "c", "d", "e", "f", "g"] },
    ];

    for (const [段番号, 期待する増分] of [1, 2, 4].entries()) {
      const 実際の増分 = 段ごとの増分(手組みの段)[段番号]?.length;
      expect(実際の増分, `手組み見本の ${段番号 + 1} 段目の増分が ${実際の増分} 件`).toBe(期待する増分);
    }
  });
});
