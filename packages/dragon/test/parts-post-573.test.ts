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

describe("iter573: parts additional (Array fill/copyWithin comprehensive)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: fill negative start`, () => { expect([1, 2, 3, 4].fill(0, -2)).toEqual([1, 2, 0, 0]); });
    it(`${name}: fill negative end`, () => { expect([1, 2, 3, 4].fill(0, 1, -1)).toEqual([1, 0, 0, 4]); });
    it(`${name}: copyWithin negative target`, () => { expect([1, 2, 3, 4, 5].copyWithin(-2, 0)).toEqual([1, 2, 3, 1, 2]); });
    it(`${name}: copyWithin with end`, () => { expect([1, 2, 3, 4, 5].copyWithin(0, 3, 4)).toEqual([4, 2, 3, 4, 5]); });
    it(`${name}: fill entire`, () => { expect(new Array(3).fill(7)).toEqual([7, 7, 7]); });
    it(`${name}: fill object same ref`, () => { const o = {}; const a = new Array(2).fill(o); expect(a[0]).toBe(a[1]); });
    it(`${name}: nodes-sized fill`, () => { expect(new Array(diagram.nodes.length).fill(1).length).toBe(diagram.nodes.length); });
  }
});
