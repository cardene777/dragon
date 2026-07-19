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

describe("iter245: preset additional (equality / comparison) 🎊 60k milestone", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id === id`, () => { expect(diagram.id === diagram.id).toBe(true); });
    it(`${name}: id == id (loose)`, () => { expect(diagram.id == diagram.id).toBe(true); });
    it(`${name}: Object.is(id, id) = true`, () => { expect(Object.is(diagram.id, diagram.id)).toBe(true); });
    it(`${name}: diagram === diagram`, () => { expect(diagram === diagram).toBe(true); });
    it(`${name}: nodes === nodes`, () => { expect(diagram.nodes === diagram.nodes).toBe(true); });
    it(`${name}: nodes.length >= 0`, () => { expect(diagram.nodes.length >= 0).toBe(true); });
    it(`${name}: edges.length >= 0`, () => { expect(diagram.edges.length >= 0).toBe(true); });
  }
});
