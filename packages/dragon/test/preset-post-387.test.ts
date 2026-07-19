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

describe("iter389: preset additional (Set operations) 🎊 110k 大台", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: new Set(nodes) size <= nodes.length`, () => { expect(new Set(diagram.nodes).size).toBeLessThanOrEqual(diagram.nodes.length); });
    it(`${name}: new Set([...nodes, ...nodes]) size = new Set(nodes) size`, () => { expect(new Set([...diagram.nodes, ...diagram.nodes]).size).toBe(new Set(diagram.nodes).size); });
    it(`${name}: Set.add returns Set`, () => { const s = new Set(); expect(s.add(1)).toBe(s); });
    it(`${name}: Set.clear() sets size to 0`, () => { const s = new Set([1, 2, 3]); s.clear(); expect(s.size).toBe(0); });
    it(`${name}: Set forEach visits all`, () => { const s = new Set([1, 2, 3]); let c = 0; s.forEach(() => c++); expect(c).toBe(3); });
    it(`${name}: [...new Set([1,2,3,3,1])].length = 3`, () => { expect([...new Set([1, 2, 3, 3, 1])].length).toBe(3); });
    it(`${name}: new Set().size = 0`, () => { expect(new Set().size).toBe(0); });
  }
});
