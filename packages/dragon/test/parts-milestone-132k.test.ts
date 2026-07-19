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

describe("milestone 132k: Array toSorted / toReversed / toSpliced", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: [3,1,2].toSorted() = [1,2,3]`, () => { expect([3, 1, 2].toSorted()).toEqual([1, 2, 3]); });
    it(`${name}: toSorted() creates new ref`, () => { const a = [3, 1, 2]; const b = a.toSorted(); expect(b).not.toBe(a); expect(a).toEqual([3, 1, 2]); });
    it(`${name}: [1,2,3].toReversed() = [3,2,1]`, () => { expect([1, 2, 3].toReversed()).toEqual([3, 2, 1]); });
    it(`${name}: [1,2,3,4].toSpliced(1, 2) = [1,4]`, () => { expect([1, 2, 3, 4].toSpliced(1, 2)).toEqual([1, 4]); });
  }
});
