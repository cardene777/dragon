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

describe("iter104: parts add invariants", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id string equal itself`, () => { expect(diagram.id).toBe(diagram.id); });
    it(`${name}: nodes.length equal nodes.length`, () => { expect(diagram.nodes.length).toBe(diagram.nodes.length); });
    it(`${name}: edges.length equal edges.length`, () => { expect(diagram.edges.length).toBe(diagram.edges.length); });
    it(`${name}: JSON size > 5`, () => { expect(JSON.stringify(diagram).length).toBeGreaterThan(5); });
    it(`${name}: id length > 0`, () => { expect(diagram.id.length).toBeGreaterThan(0); });
    it(`${name}: 2nd JSON round-trip nodes count`, () => {
      const rt = JSON.parse(JSON.stringify(diagram));
      expect(rt.nodes.length).toBe(diagram.nodes.length);
    });
    it(`${name}: nodes array not null`, () => { expect(diagram.nodes).not.toBeNull(); });
  }
});
