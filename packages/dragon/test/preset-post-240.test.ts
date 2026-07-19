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

describe("iter242: preset additional (Object.assign / spread)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Object.assign({}, d).id = id`, () => { expect(Object.assign({} as Partial<CdlDiagram>, diagram).id).toBe(diagram.id); });
    it(`${name}: {...d}.id = id`, () => { expect(({ ...diagram }).id).toBe(diagram.id); });
    it(`${name}: Object.assign({}, d).nodes = nodes`, () => { expect(Object.assign({} as Partial<CdlDiagram>, diagram).nodes).toBe(diagram.nodes); });
    it(`${name}: {...d, extra: 1}.extra = 1`, () => { expect(({ ...diagram, extra: 1 }).extra).toBe(1); });
    it(`${name}: Object.assign preserves keys count >= 3`, () => { expect(Object.keys(Object.assign({} as Partial<CdlDiagram>, diagram)).length).toBeGreaterThanOrEqual(3); });
    it(`${name}: spread preserves keys count >= 3`, () => { expect(Object.keys({ ...diagram }).length).toBeGreaterThanOrEqual(3); });
    it(`${name}: {...d} not = d ref`, () => { expect(({ ...diagram })).not.toBe(diagram); });
  }
});
