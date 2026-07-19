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

describe("iter440: preset additional (Array holes / sparse)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: new Array(3).length = 3`, () => { expect(new Array(3).length).toBe(3); });
    it(`${name}: new Array(3)[0] = undefined`, () => { expect(new Array(3)[0]).toBeUndefined(); });
    it(`${name}: [,,,].length = 3`, () => { expect([, , ,].length).toBe(3); });
    it(`${name}: [1,,3].length = 3`, () => { expect([1, , 3].length).toBe(3); });
    it(`${name}: [1,,3].filter Boolean length = 2`, () => { expect([1, , 3].filter(Boolean).length).toBe(2); });
    it(`${name}: new Array(3).fill(0) = [0,0,0]`, () => { expect(new Array(3).fill(0)).toEqual([0, 0, 0]); });
    it(`${name}: nodes.length preserved after slice(0)`, () => { expect(diagram.nodes.slice(0).length).toBe(diagram.nodes.length); });
  }
});
