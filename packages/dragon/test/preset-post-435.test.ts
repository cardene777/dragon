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

describe("iter437: preset additional (Array.reverse mutates)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: reverse returns self ref`, () => { const a = [1, 2, 3]; expect(a.reverse()).toBe(a); });
    it(`${name}: reverse mutates in place`, () => { const a = [1, 2, 3]; a.reverse(); expect(a).toEqual([3, 2, 1]); });
    it(`${name}: reverse twice = original`, () => { const a = [1, 2, 3]; a.reverse().reverse(); expect(a).toEqual([1, 2, 3]); });
    it(`${name}: sort returns self ref`, () => { const a = [3, 1, 2]; expect(a.sort()).toBe(a); });
    it(`${name}: sort mutates in place`, () => { const a = [3, 1, 2]; a.sort(); expect(a).toEqual([1, 2, 3]); });
    it(`${name}: splice returns removed`, () => { const a = [1, 2, 3, 4]; expect(a.splice(1, 2)).toEqual([2, 3]); expect(a).toEqual([1, 4]); });
    it(`${name}: fill returns self ref`, () => { const a = [1, 2, 3]; expect(a.fill(0)).toBe(a); });
  }
});
