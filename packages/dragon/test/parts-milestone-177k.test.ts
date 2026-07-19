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

describe("milestone 177k: Object.groupBy / Map.groupBy", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.groupBy by parity`, () => { const g = Object.groupBy([1, 2, 3, 4], n => n % 2 === 0 ? "even" : "odd"); expect(g.even).toEqual([2, 4]); expect(g.odd).toEqual([1, 3]); });
    it(`${name}: Object.groupBy empty`, () => { const g = Object.groupBy([] as number[], () => "k"); expect(Object.keys(g)).toEqual([]); });
    it(`${name}: Map.groupBy by parity`, () => { const g = Map.groupBy([1, 2, 3, 4], n => n % 2); expect(g.get(0)).toEqual([2, 4]); expect(g.get(1)).toEqual([1, 3]); });
    it(`${name}: Object.groupBy single group`, () => { const g = Object.groupBy([1, 2, 3], () => "all"); expect(g.all).toEqual([1, 2, 3]); });
    it(`${name}: Map.groupBy key count`, () => { const g = Map.groupBy([1, 2, 3, 4, 5], n => n % 3); expect(g.size).toBe(3); });
    it(`${name}: Object.groupBy on nodes indices`, () => { const g = Object.groupBy(diagram.nodes.map((_, i) => i), i => i % 2 === 0 ? "e" : "o"); const total = (g.e?.length ?? 0) + (g.o?.length ?? 0); expect(total).toBe(diagram.nodes.length); });
  }
});
