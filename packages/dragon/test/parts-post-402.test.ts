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

describe("iter402: parts additional (structuredClone)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: structuredClone(d).id = id`, () => { expect(structuredClone(diagram).id).toBe(diagram.id); });
    it(`${name}: structuredClone(d) deep equal d`, () => { expect(structuredClone(diagram)).toEqual(diagram); });
    it(`${name}: structuredClone(d) not = d ref`, () => { expect(structuredClone(diagram)).not.toBe(diagram); });
    it(`${name}: structuredClone(nodes) deep equal nodes`, () => { expect(structuredClone(diagram.nodes)).toEqual(diagram.nodes); });
    it(`${name}: structuredClone(nodes) not = nodes ref`, () => { expect(structuredClone(diagram.nodes)).not.toBe(diagram.nodes); });
    it(`${name}: structuredClone(id) = id`, () => { expect(structuredClone(diagram.id)).toBe(diagram.id); });
    it(`${name}: structuredClone([1,2,3]) = [1,2,3]`, () => { expect(structuredClone([1, 2, 3])).toEqual([1, 2, 3]); });
  }
});
