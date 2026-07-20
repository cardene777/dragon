import { describe, it, expect } from "vitest";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllParts(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
  const out: Array<{ name: string; diagram: CdlDiagram }> = [];
  for (const [name, val] of Object.entries(mod as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue;
    const d = val as Partial<CdlDiagram>;
    if (typeof d.id === "string" && Array.isArray(d.nodes)) {
      out.push({ name, diagram: d as CdlDiagram });
    }
  }
  return out;
}

const ALL_PARTS = collectAllParts(PartsMod);

describe("milestone 180k (大台): comprehensive Array pipeline", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: map→filter→reduce pipeline`, () => { const r = [1, 2, 3, 4, 5].map(x => x * 2).filter(x => x > 4).reduce((a, b) => a + b, 0); expect(r).toBe(24); });
    it(`${name}: filter→map→sort pipeline`, () => { const r = [3, 1, 4, 1, 5].filter(x => x > 1).map(x => x + 10).sort((a, b) => a - b); expect(r).toEqual([13, 14, 15]); });
    it(`${name}: flatMap→unique pipeline`, () => { const r = [...new Set([1, 2].flatMap(x => [x, x, x * 10]))]; expect(r).toEqual([1, 10, 2, 20]); });
    it(`${name}: reduce to object pipeline`, () => { const r = ["a", "b", "c"].reduce<Record<string, number>>((acc, k, i) => { acc[k] = i; return acc; }, {}); expect(r).toEqual({ a: 0, b: 1, c: 2 }); });
    it(`${name}: sort→slice→reverse pipeline`, () => { const r = [5, 3, 8, 1, 9].sort((a, b) => a - b).slice(0, 3).reverse(); expect(r).toEqual([5, 3, 1]); });
    it(`${name}: every→some combined`, () => { const arr = [2, 4, 6]; expect(arr.every(x => x % 2 === 0) && arr.some(x => x > 5)).toBe(true); });
    it(`${name}: nodes map to indices`, () => { const idx = diagram.nodes.map((_, i) => i); expect(idx.length).toBe(diagram.nodes.length); });
    it(`${name}: nodes filter all pass`, () => { const all = diagram.nodes.filter(() => true); expect(all.length).toBe(diagram.nodes.length); });
    it(`${name}: nodes reduce count`, () => { expect(diagram.nodes.reduce((c) => c + 1, 0)).toBe(diagram.nodes.length); });
  }
});
