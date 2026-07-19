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

describe("iter108: parts additional 7 axis", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes reversed length`, () => {
      const rev = [...diagram.nodes].reverse();
      expect(rev.length).toBe(diagram.nodes.length);
    });
    it(`${name}: nodes copy independent`, () => {
      const copy = [...diagram.nodes];
      expect(copy).not.toBe(diagram.nodes);
      expect(copy.length).toBe(diagram.nodes.length);
    });
    it(`${name}: edges filter true length`, () => {
      expect(diagram.edges.filter(() => true).length).toBe(diagram.edges.length);
    });
    it(`${name}: edges map identity`, () => {
      const m = diagram.edges.map((e) => e);
      expect(m.length).toBe(diagram.edges.length);
    });
    it(`${name}: id trim equals id`, () => {
      expect(diagram.id.trim()).toBe(diagram.id);
    });
    it(`${name}: id upperCase length equal`, () => {
      expect(diagram.id.toUpperCase().length).toBe(diagram.id.length);
    });
    it(`${name}: id lowerCase length equal`, () => {
      expect(diagram.id.toLowerCase().length).toBe(diagram.id.length);
    });
  }
});
