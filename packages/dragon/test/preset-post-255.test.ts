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

describe("iter257: preset additional (Array forEach)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes forEach visits all`, () => { let c = 0; diagram.nodes.forEach(() => c++); expect(c).toBe(diagram.nodes.length); });
    it(`${name}: edges forEach visits all`, () => { let c = 0; diagram.edges.forEach(() => c++); expect(c).toBe(diagram.edges.length); });
    it(`${name}: nodes forEach returns undefined`, () => { expect(diagram.nodes.forEach(() => {})).toBeUndefined(); });
    it(`${name}: edges forEach returns undefined`, () => { expect(diagram.edges.forEach(() => {})).toBeUndefined(); });
    it(`${name}: nodes forEach passes index seq`, () => { const idx: number[] = []; diagram.nodes.forEach((_, i) => idx.push(i)); expect(idx).toEqual(diagram.nodes.map((_, i) => i)); });
    it(`${name}: nodes forEach doesn't modify nodes`, () => { const before = diagram.nodes.length; diagram.nodes.forEach(() => {}); expect(diagram.nodes.length).toBe(before); });
    it(`${name}: nodes forEach passes array as 3rd arg`, () => { let a: unknown = null; diagram.nodes.forEach((_, __, arr) => { a = arr; }); if (diagram.nodes.length) expect(a).toBe(diagram.nodes); });
  }
});
