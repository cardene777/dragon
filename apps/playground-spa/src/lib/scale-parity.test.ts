import { describe, it, expect } from "vitest";
import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { normalizeScale } from "./svg-pixel-size";
import { clampDiagramScale, MIN_DIAGRAM_SCALE, MAX_DIAGRAM_SCALE } from "./diagram-scale";

/**
 * 倍率の丸め方が cdl と一致することを、 **cdl の実挙動と突き合わせて** 保証する。
 *
 * 倍率の上下限は 3 箇所にある。
 *
 * | 場所 | 範囲 | 役割 |
 * |---|---|---|
 * | cdl `normalizeDiagramScale` | 0.125 - 8 | 実際に描画に効く値 |
 * | `svg-pixel-size.ts` `normalizeScale` | 0.125 - 8 | 編集画面が部品と座標変換に使う値 |
 * | `diagram-scale.ts` `clampDiagramScale` | 0.5 - 3 | 倍率ボタンが DSL に書ける範囲 |
 *
 * 上 2 つがずれると、 図に効く倍率と部品に効く倍率が食い違って部品が図から外れる。
 * cdl 側の定数は export されていないので、 値を照合するのではなく `layout()` に通した
 * 実際の `diagramScale` と突き合わせる。 cdl が範囲を変えればこの test が落ちる。
 *
 * 3 つ目は意図的に狭い。 ボタンで行き過ぎないための UI 上の制限で、 上 2 つの部分集合で
 * あることだけを守る (はみ出すと DSL に書いた値が描画で丸められ、 表示と実際がずれる)。
 */

/**
 * cdl が実際に採用する倍率。 未指定扱いは 1 として読む (cdl は undefined を返す)。
 *
 * fixture は倍率の判定に要る最小構成にする。 `diagramScale` は `viewport.scale` だけで
 * 決まるので、 node も edge も phase も要らない。 型を満たす空の形にして cast を使わない
 * (cast で通すと、 fixture が実装の想定とずれても気付けない)。
 */
function cdlScale(value: number | undefined): number {
  const base: CdlDiagram = {
    id: "parity",
    topic: "T",
    lanes: [{ id: "l1", x: 0, width: 400 }],
    nodes: [],
    edges: [],
    states: [],
    phases: [],
  };
  const diag = value === undefined ? base : { ...base, viewport: { scale: value } };
  return layout(diag).diagramScale ?? 1;
}

describe("編集画面の倍率が cdl の採用値と一致する", () => {
  const CASES: Array<[string, number | undefined]> = [
    ["未指定", undefined],
    ["1 ちょうど", 1],
    ["通常の拡大", 1.25],
    ["通常の拡大 (小数)", 1.563],
    ["通常の縮小", 0.5],
    ["下限ちょうど", 0.125],
    ["下限より小さい", 0.0001],
    ["上限ちょうど", 8],
    ["上限より大きい", 100],
    ["0", 0],
    ["負値", -2],
    ["NaN", NaN],
    ["正の無限大", Infinity],
    ["負の無限大", -Infinity],
  ];

  for (const [name, input] of CASES) {
    it(`${name} で cdl と同じ値になる`, () => {
      expect(normalizeScale(input)).toBe(cdlScale(input));
    });
  }

  it("編集画面が書ける範囲は cdl の範囲に収まる", () => {
    // はみ出すと DSL に書いた値が描画側で丸められ、 UI の表示と実際の描画がずれる
    expect(MIN_DIAGRAM_SCALE).toBeGreaterThanOrEqual(cdlScale(0.0001));
    expect(MAX_DIAGRAM_SCALE).toBeLessThanOrEqual(cdlScale(100));
  });

  it("編集画面が書ける範囲の値は cdl がそのまま採用する", () => {
    for (const k of [MIN_DIAGRAM_SCALE, 0.8, 1.25, 2, MAX_DIAGRAM_SCALE]) {
      expect(cdlScale(k), `倍率 ${k}`).toBe(k);
      expect(normalizeScale(k), `倍率 ${k}`).toBe(k);
    }
  });

  it("倍率ボタンで到達しうる値は全て cdl と一致する", () => {
    // 1 から 1.25 倍ずつ上げ下げした時に通る値を、 上下限に張り付くまで辿る
    let k = 1;
    const seen = new Set<number>();
    for (let i = 0; i < 20; i++) {
      k = clampDiagramScale(k * 1.25);
      if (seen.has(k)) break;
      seen.add(k);
      expect(normalizeScale(k), `拡大 ${i + 1} 回目 (${k})`).toBe(cdlScale(k));
    }
    k = 1;
    seen.clear();
    for (let i = 0; i < 20; i++) {
      k = clampDiagramScale(k / 1.25);
      if (seen.has(k)) break;
      seen.add(k);
      expect(normalizeScale(k), `縮小 ${i + 1} 回目 (${k})`).toBe(cdlScale(k));
    }
  });
});
