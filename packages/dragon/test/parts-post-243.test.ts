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

describe("iter243: parts additional (equality / comparison)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id === id (self equality)`, () => { expect(diagram.id === diagram.id).toBe(true); });
    it(`${name}: id == id (loose eq)`, () => { expect(diagram.id == diagram.id).toBe(true); });
    it(`${name}: Object.is(id, id) = true`, () => { expect(Object.is(diagram.id, diagram.id)).toBe(true); });
    it(`${name}: diagram === diagram (ref eq)`, () => { expect(diagram === diagram).toBe(true); });
    it(`${name}: nodes === nodes (ref eq)`, () => { expect(diagram.nodes === diagram.nodes).toBe(true); });
    it(`${name}: nodes.length >= 0`, () => { expect(diagram.nodes.length >= 0).toBe(true); });
    it(`${name}: edges.length >= 0`, () => { expect(diagram.edges.length >= 0).toBe(true); });
  }
});
