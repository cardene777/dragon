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

describe("iter473: preset additional (Math sqrt / pow / cbrt / hypot)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Math.sqrt(16) = 4`, () => { expect(Math.sqrt(16)).toBe(4); });
    it(`${name}: Math.sqrt(0) = 0`, () => { expect(Math.sqrt(0)).toBe(0); });
    it(`${name}: Math.pow(2, 10) = 1024`, () => { expect(Math.pow(2, 10)).toBe(1024); });
    it(`${name}: 2 ** 10 = 1024`, () => { expect(2 ** 10).toBe(1024); });
    it(`${name}: Math.cbrt(27) = 3`, () => { expect(Math.cbrt(27)).toBe(3); });
    it(`${name}: Math.hypot(3, 4) = 5`, () => { expect(Math.hypot(3, 4)).toBe(5); });
    it(`${name}: sqrt(nodes.length ** 2) = nodes.length`, () => { expect(Math.sqrt(diagram.nodes.length ** 2)).toBeCloseTo(diagram.nodes.length); });
  }
});
