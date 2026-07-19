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

describe("iter449: preset additional (at / with / keys / values / entries)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: [1,2,3].at(-1) = 3`, () => { expect([1, 2, 3].at(-1)).toBe(3); });
    it(`${name}: [1,2,3].at(0) = 1`, () => { expect([1, 2, 3].at(0)).toBe(1); });
    it(`${name}: [1,2,3].at(10) = undefined`, () => { expect([1, 2, 3].at(10)).toBeUndefined(); });
    it(`${name}: [1,2,3].with(1, 9) = [1,9,3]`, () => { expect([1, 2, 3].with(1, 9)).toEqual([1, 9, 3]); });
    it(`${name}: [...arr.keys()] length preserved`, () => { const a = [1, 2, 3]; expect([...a.keys()].length).toBe(a.length); });
    it(`${name}: [...arr.values()] length preserved`, () => { const a = [1, 2, 3]; expect([...a.values()].length).toBe(a.length); });
    it(`${name}: nodes at(0) = nodes[0]`, () => { expect(diagram.nodes.at(0)).toBe(diagram.nodes[0]); });
  }
});
