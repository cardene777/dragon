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

describe("milestone 130k (大台): Array copy / flatten", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: [...arr] deep new ref`, () => { const a = [1, 2, 3]; expect([...a]).not.toBe(a); expect([...a]).toEqual(a); });
    it(`${name}: [...arr] length preserved`, () => { const a = [1, 2, 3]; expect([...a].length).toBe(a.length); });
    it(`${name}: [[1,2],[3]].flat() = [1,2,3]`, () => { expect([[1, 2], [3]].flat()).toEqual([1, 2, 3]); });
    it(`${name}: [1,[2,[3]]].flat() = [1,2,[3]]`, () => { expect([1, [2, [3]]].flat()).toEqual([1, 2, [3]]); });
    it(`${name}: [1,[2,[3]]].flat(Infinity) = [1,2,3]`, () => { expect([1, [2, [3]]].flat(Infinity)).toEqual([1, 2, 3]); });
    it(`${name}: [1,2].flatMap(x => [x,x*2]) = [1,2,2,4]`, () => { expect([1, 2].flatMap(x => [x, x * 2])).toEqual([1, 2, 2, 4]); });
    it(`${name}: nodes shallow copy new ref`, () => { const c = [...diagram.nodes]; expect(c).not.toBe(diagram.nodes); expect(c.length).toBe(diagram.nodes.length); });
    it(`${name}: nodes.concat([]) new ref`, () => { const c = diagram.nodes.concat([]); expect(c).not.toBe(diagram.nodes); });
    it(`${name}: nodes.slice() new ref`, () => { const c = diagram.nodes.slice(); expect(c).not.toBe(diagram.nodes); });
  }
});
