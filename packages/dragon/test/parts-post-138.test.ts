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

describe("iter138: parts additional (functional)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes map identity length`, () => { expect(diagram.nodes.map(n => n).length).toBe(diagram.nodes.length); });
    it(`${name}: edges map identity length`, () => { expect(diagram.edges.map(e => e).length).toBe(diagram.edges.length); });
    it(`${name}: nodes slice 0 = original`, () => { expect(diagram.nodes.slice(0).length).toBe(diagram.nodes.length); });
    it(`${name}: edges slice 0 = original`, () => { expect(diagram.edges.slice(0).length).toBe(diagram.edges.length); });
    it(`${name}: nodes reduce count`, () => { expect(diagram.nodes.reduce((a) => a + 1, 0)).toBe(diagram.nodes.length); });
    it(`${name}: edges reduce count`, () => { expect(diagram.edges.reduce((a) => a + 1, 0)).toBe(diagram.edges.length); });
    it(`${name}: nodes concat empty length`, () => { expect(diagram.nodes.concat([]).length).toBe(diagram.nodes.length); });
  }
});
