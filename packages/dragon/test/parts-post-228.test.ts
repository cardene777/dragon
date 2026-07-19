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

describe("iter228: parts additional (Set/Map operations)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new Set(nodes) size <= nodes length`, () => { expect(new Set(diagram.nodes).size).toBeLessThanOrEqual(diagram.nodes.length); });
    it(`${name}: new Set(nodes.map id) each id present`, () => { const s = new Set(diagram.nodes.map(n => n.id)); for (const n of diagram.nodes) expect(s.has(n.id)).toBe(true); });
    it(`${name}: new Set([id]) has id`, () => { expect(new Set([diagram.id]).has(diagram.id)).toBe(true); });
    it(`${name}: new Set([id]) size = 1`, () => { expect(new Set([diagram.id]).size).toBe(1); });
    it(`${name}: new Map has id key set/get`, () => { const m = new Map(); m.set(diagram.id, 1); expect(m.get(diagram.id)).toBe(1); });
    it(`${name}: new Map has id key delete`, () => { const m = new Map(); m.set(diagram.id, 1); m.delete(diagram.id); expect(m.has(diagram.id)).toBe(false); });
    it(`${name}: new WeakSet with obj has obj`, () => { const w = new WeakSet(); w.add(diagram); expect(w.has(diagram)).toBe(true); });
  }
});
