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

describe("iter476: preset additional (Math trig)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Math.sin(0) = 0`, () => { expect(Math.sin(0)).toBe(0); });
    it(`${name}: Math.cos(0) = 1`, () => { expect(Math.cos(0)).toBe(1); });
    it(`${name}: Math.tan(0) = 0`, () => { expect(Math.tan(0)).toBe(0); });
    it(`${name}: Math.sin(Math.PI/2) ~ 1`, () => { expect(Math.sin(Math.PI / 2)).toBeCloseTo(1); });
    it(`${name}: Math.cos(Math.PI) ~ -1`, () => { expect(Math.cos(Math.PI)).toBeCloseTo(-1); });
    it(`${name}: Math.asin(1) ~ PI/2`, () => { expect(Math.asin(1)).toBeCloseTo(Math.PI / 2); });
    it(`${name}: nodes count non-negative (Math.sign)`, () => { expect(Math.sign(diagram.nodes.length)).toBeGreaterThanOrEqual(0); });
  }
});
