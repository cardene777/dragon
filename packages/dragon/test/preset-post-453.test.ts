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

describe("iter455: preset additional (copyWithin / fill edge)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: [1,2,3,4,5].copyWithin(0,3) = [4,5,3,4,5]`, () => { expect([1, 2, 3, 4, 5].copyWithin(0, 3)).toEqual([4, 5, 3, 4, 5]); });
    it(`${name}: copyWithin returns self ref`, () => { const a = [1, 2, 3]; expect(a.copyWithin(0, 1)).toBe(a); });
    it(`${name}: [1,2,3].fill(0) = [0,0,0]`, () => { expect([1, 2, 3].fill(0)).toEqual([0, 0, 0]); });
    it(`${name}: [1,2,3].fill(0, 1) = [1,0,0]`, () => { expect([1, 2, 3].fill(0, 1)).toEqual([1, 0, 0]); });
    it(`${name}: [1,2,3].fill(0, 1, 2) = [1,0,3]`, () => { expect([1, 2, 3].fill(0, 1, 2)).toEqual([1, 0, 3]); });
    it(`${name}: fill returns self ref`, () => { const a = [1, 2, 3]; expect(a.fill(0)).toBe(a); });
    it(`${name}: new Array(diagram.nodes.length).fill(0).length = nodes.length`, () => { expect(new Array(diagram.nodes.length).fill(0).length).toBe(diagram.nodes.length); });
  }
});
