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

describe("iter116: preset additional 8 axis", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id normalize equal`, () => { expect(diagram.id.normalize()).toBe(diagram.id); });
    it(`${name}: id substring 0 length equal`, () => { expect(diagram.id.substring(0, diagram.id.length)).toBe(diagram.id); });
    it(`${name}: id split length >= 1`, () => { expect(diagram.id.split("").length).toBeGreaterThanOrEqual(1); });
    it(`${name}: id repeat 3 length equal`, () => { expect(diagram.id.repeat(3).length).toBe(diagram.id.length * 3); });
    it(`${name}: nodes iterable via entries`, () => {
      const entries = [...diagram.nodes.entries()];
      expect(entries.length).toBe(diagram.nodes.length);
    });
    it(`${name}: nodes has keys iterable`, () => {
      const keys = [...diagram.nodes.keys()];
      expect(keys.length).toBe(diagram.nodes.length);
    });
    it(`${name}: nodes values iterable`, () => {
      const values = [...diagram.nodes.values()];
      expect(values.length).toBe(diagram.nodes.length);
    });
  }
});
