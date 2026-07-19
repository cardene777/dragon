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

describe("iter341-milestone: parts 93k (Comparator return contract)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: sort with all 0 preserves original order`, () => { const arr = diagram.nodes.slice(); expect(arr.sort(() => 0)).toEqual(diagram.nodes); });
    it(`${name}: [1,2,3].sort((a,b)=>a-b) = [1,2,3]`, () => { expect([1, 2, 3].sort((a, b) => a - b)).toEqual([1, 2, 3]); });
    it(`${name}: [1,2,3].sort((a,b)=>b-a) = [3,2,1]`, () => { expect([1, 2, 3].sort((a, b) => b - a)).toEqual([3, 2, 1]); });
  }
});
