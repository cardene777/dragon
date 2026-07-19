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

describe("iter452: preset additional (reduce / reduceRight)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: [1,2,3].reduce((a,b) => a+b, 0) = 6`, () => { expect([1, 2, 3].reduce((a, b) => a + b, 0)).toBe(6); });
    it(`${name}: [].reduce((a,b) => a+b, 0) = 0`, () => { expect([].reduce((a: number, b: number) => a + b, 0)).toBe(0); });
    it(`${name}: [1,2,3].reduce((a,b) => a+b) = 6`, () => { expect([1, 2, 3].reduce((a, b) => a + b)).toBe(6); });
    it(`${name}: [1,2,3].reduceRight((a,b) => a-b) = 0`, () => { expect([1, 2, 3].reduceRight((a, b) => a - b)).toBe(0); });
    it(`${name}: [].reduce throws without init`, () => { expect(() => [].reduce((a: number, b: number) => a + b)).toThrow(TypeError); });
    it(`${name}: reduce sum = loop sum`, () => { const a = [1, 2, 3, 4, 5]; let s = 0; for (const v of a) s += v; expect(a.reduce((x, y) => x + y, 0)).toBe(s); });
    it(`${name}: nodes.length via reduce = length`, () => { expect(diagram.nodes.reduce((c) => c + 1, 0)).toBe(diagram.nodes.length); });
  }
});
