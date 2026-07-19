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

describe("iter534: parts additional (Array sort comparator)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: numeric asc`, () => { expect([3, 1, 2].sort((a, b) => a - b)).toEqual([1, 2, 3]); });
    it(`${name}: numeric desc`, () => { expect([3, 1, 2].sort((a, b) => b - a)).toEqual([3, 2, 1]); });
    it(`${name}: default lexicographic`, () => { expect([10, 2, 1].sort()).toEqual([1, 10, 2]); });
    it(`${name}: string sort`, () => { expect(["c", "a", "b"].sort()).toEqual(["a", "b", "c"]); });
    it(`${name}: stable sort`, () => { const arr = [{ k: 1, v: "a" }, { k: 1, v: "b" }, { k: 0, v: "c" }]; const sorted = arr.sort((a, b) => a.k - b.k); expect(sorted[1].v).toBe("a"); expect(sorted[2].v).toBe("b"); });
    it(`${name}: sort by length`, () => { expect(["aaa", "a", "aa"].sort((a, b) => a.length - b.length)).toEqual(["a", "aa", "aaa"]); });
    it(`${name}: sort empty stays empty`, () => { expect([].sort()).toEqual([]); });
  }
});
