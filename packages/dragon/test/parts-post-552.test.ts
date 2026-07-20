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

describe("iter552: parts additional (Array flat deep / isArray edge)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: flat depth 0 = shallow copy`, () => { expect([1, [2]].flat(0)).toEqual([1, [2]]); });
    it(`${name}: flat depth 2`, () => { expect([1, [2, [3, [4]]]].flat(2)).toEqual([1, 2, 3, [4]]); });
    it(`${name}: flat removes empty slots`, () => { expect([1, , 3].flat()).toEqual([1, 3]); });
    it(`${name}: Array.isArray(new Array()) = true`, () => { expect(Array.isArray(new Array())).toBe(true); });
    it(`${name}: Array.isArray("abc") = false`, () => { expect(Array.isArray("abc")).toBe(false); });
    it(`${name}: Array.isArray({length:0}) = false`, () => { expect(Array.isArray({ length: 0 })).toBe(false); });
    it(`${name}: Array.isArray(nodes) = true`, () => { expect(Array.isArray(diagram.nodes)).toBe(true); });
  }
});
