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

describe("iter536: preset additional (Array sort comparator)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: numeric asc`, () => { expect([3, 1, 2].sort((a, b) => a - b)).toEqual([1, 2, 3]); });
    it(`${name}: numeric desc`, () => { expect([3, 1, 2].sort((a, b) => b - a)).toEqual([3, 2, 1]); });
    it(`${name}: default lexicographic`, () => { expect([10, 2, 1].sort()).toEqual([1, 10, 2]); });
    it(`${name}: string sort`, () => { expect(["c", "a", "b"].sort()).toEqual(["a", "b", "c"]); });
    it(`${name}: sort by length`, () => { expect(["aaa", "a", "aa"].sort((a, b) => a.length - b.length)).toEqual(["a", "aa", "aaa"]); });
    it(`${name}: sort empty stays empty`, () => { expect([].sort()).toEqual([]); });
    it(`${name}: nodes indices sortable`, () => { const idx = diagram.nodes.map((_, i) => i).sort((a, b) => b - a); expect(idx.length).toBe(diagram.nodes.length); });
  }
});
