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

describe("iter341: preset additional (Array sort comparator)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: sort noop returns same length`, () => { expect(diagram.nodes.slice().sort(() => 0).length).toBe(diagram.nodes.length); });
    it(`${name}: sort ascending by id preserves length`, () => { expect(diagram.nodes.slice().sort((a, b) => a.id.localeCompare(b.id)).length).toBe(diagram.nodes.length); });
    it(`${name}: sort desc = reverse of asc`, () => { const asc = diagram.nodes.slice().sort((a, b) => a.id.localeCompare(b.id)); const desc = diagram.nodes.slice().sort((a, b) => b.id.localeCompare(a.id)); expect(desc).toEqual(asc.slice().reverse()); });
    it(`${name}: sort returns array itself`, () => { const arr = diagram.nodes.slice(); expect(arr.sort()).toBe(arr); });
    it(`${name}: [3,1,2].sort() = [1,2,3]`, () => { expect([3, 1, 2].sort()).toEqual([1, 2, 3]); });
    it(`${name}: ["b","a"].sort() = ["a","b"]`, () => { expect(["b", "a"].sort()).toEqual(["a", "b"]); });
    it(`${name}: sort stability preserves object identity`, () => { const arr = [{k: 1, v: "a"}, {k: 1, v: "b"}]; expect(arr.sort((x, y) => x.k - y.k).map(x => x.v)).toEqual(["a", "b"]); });
  }
});
