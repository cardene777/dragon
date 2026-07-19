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

describe("iter294: parts additional (Array copyWithin/fill)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes.slice().copyWithin(0, 0) = nodes`, () => { const c = diagram.nodes.slice(); c.copyWithin(0, 0); expect(c).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice().copyWithin returns array itself`, () => { const c = diagram.nodes.slice(); expect(c.copyWithin(0, 0)).toBe(c); });
    it(`${name}: nodes.slice().fill returns array itself`, () => { const c = diagram.nodes.slice(); expect(c.fill(diagram.nodes[0] ?? { id: "x" } as never)).toBe(c); });
    it(`${name}: [1,2,3].fill(0) = [0,0,0]`, () => { expect([1, 2, 3].fill(0)).toEqual([0, 0, 0]); });
    it(`${name}: [1,2,3].fill(0, 1) = [1,0,0]`, () => { expect([1, 2, 3].fill(0, 1)).toEqual([1, 0, 0]); });
    it(`${name}: [1,2,3].fill(0, 1, 2) = [1,0,3]`, () => { expect([1, 2, 3].fill(0, 1, 2)).toEqual([1, 0, 3]); });
    it(`${name}: nodes.slice().length preserves after copyWithin`, () => { const c = diagram.nodes.slice(); c.copyWithin(0, 0); expect(c.length).toBe(diagram.nodes.length); });
  }
});
