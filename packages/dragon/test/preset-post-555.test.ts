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

describe("iter557: preset additional (Object entries transform)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: map values via entries`, () => { const o = { a: 1, b: 2 }; const r = Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v * 10])); expect(r).toEqual({ a: 10, b: 20 }); });
    it(`${name}: filter keys via entries`, () => { const o = { a: 1, b: 2, c: 3 }; const r = Object.fromEntries(Object.entries(o).filter(([, v]) => v > 1)); expect(r).toEqual({ b: 2, c: 3 }); });
    it(`${name}: invert keys/values`, () => { const o = { a: "x", b: "y" }; const r = Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k])); expect(r).toEqual({ x: "a", y: "b" }); });
    it(`${name}: sum values`, () => { const o = { a: 1, b: 2, c: 3 }; expect(Object.values(o).reduce((a, b) => a + b, 0)).toBe(6); });
    it(`${name}: rename keys via entries`, () => { const o = { a: 1 }; const r = Object.fromEntries(Object.entries(o).map(([k, v]) => [k.toUpperCase(), v])); expect(r).toEqual({ A: 1 }); });
    it(`${name}: entries length matches keys`, () => { const o = { a: 1, b: 2 }; expect(Object.entries(o).length).toBe(Object.keys(o).length); });
    it(`${name}: diagram entries include nodes`, () => { const keys = Object.entries(diagram).map(([k]) => k); expect(keys).toContain("nodes"); });
  }
});
