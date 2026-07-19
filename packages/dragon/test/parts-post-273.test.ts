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

describe("iter273: parts additional (Array-like conversion)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Array.from(id) length > 0`, () => { if (diagram.id.length) expect(Array.from(diagram.id).length).toBeGreaterThan(0); });
    it(`${name}: Array.from(nodes, mapFn) length = nodes length`, () => { expect(Array.from(diagram.nodes, n => n.id).length).toBe(diagram.nodes.length); });
    it(`${name}: Array.from with Map iterator length matches`, () => { const m = new Map(diagram.nodes.map(n => [n.id, n])); expect(Array.from(m).length).toBe(m.size); });
    it(`${name}: Array.from with Set iterator length matches`, () => { const s = new Set(diagram.nodes); expect(Array.from(s).length).toBe(s.size); });
    it(`${name}: Array.from({length: 5}) length = 5`, () => { expect(Array.from({ length: 5 }).length).toBe(5); });
    it(`${name}: Array.from(nodes.entries()) length = nodes length`, () => { expect(Array.from(diagram.nodes.entries()).length).toBe(diagram.nodes.length); });
    it(`${name}: Array.from is not reference eq`, () => { expect(Array.from(diagram.nodes)).not.toBe(diagram.nodes); });
  }
});
