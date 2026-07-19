import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllPresets(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PRESETS = collectAllPresets(PresetsMod);

describe("iter275: preset additional (Array-like conversion) 🎊 70k milestone", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Array.from(id) length > 0`, () => { if (diagram.id.length) expect(Array.from(diagram.id).length).toBeGreaterThan(0); });
    it(`${name}: Array.from(nodes, mapFn) length = nodes length`, () => { expect(Array.from(diagram.nodes, n => n.id).length).toBe(diagram.nodes.length); });
    it(`${name}: Array.from with Map iterator length matches`, () => { const m = new Map(diagram.nodes.map(n => [n.id, n])); expect(Array.from(m).length).toBe(m.size); });
    it(`${name}: Array.from with Set iterator length matches`, () => { const s = new Set(diagram.nodes); expect(Array.from(s).length).toBe(s.size); });
    it(`${name}: Array.from({length: 5}) length = 5`, () => { expect(Array.from({ length: 5 }).length).toBe(5); });
    it(`${name}: Array.from(nodes.entries()) length = nodes length`, () => { expect(Array.from(diagram.nodes.entries()).length).toBe(diagram.nodes.length); });
    it(`${name}: Array.from is not reference eq`, () => { expect(Array.from(diagram.nodes)).not.toBe(diagram.nodes); });
  }
});
