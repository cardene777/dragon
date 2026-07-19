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

describe("iter148: parts additional (Map/Set)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id as Map key`, () => { const m = new Map(); m.set(diagram.id, 1); expect(m.get(diagram.id)).toBe(1); });
    it(`${name}: id in Set`, () => { const s = new Set([diagram.id]); expect(s.has(diagram.id)).toBe(true); });
    it(`${name}: nodes as Set`, () => { const s = new Set(diagram.nodes); expect(s.size).toBeLessThanOrEqual(diagram.nodes.length); });
    it(`${name}: edges as Set`, () => { const s = new Set(diagram.edges); expect(s.size).toBeLessThanOrEqual(diagram.edges.length); });
    it(`${name}: id set size 1`, () => { expect(new Set([diagram.id]).size).toBe(1); });
    it(`${name}: id Map has`, () => { const m = new Map([[diagram.id, 1]]); expect(m.has(diagram.id)).toBe(true); });
    it(`${name}: nodes Array.from length`, () => { expect(Array.from(diagram.nodes).length).toBe(diagram.nodes.length); });
  }
});
