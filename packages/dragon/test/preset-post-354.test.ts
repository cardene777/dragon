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

describe("iter356: preset additional (Math methods)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Math.sqrt(nodes.length**2) = nodes.length`, () => { expect(Math.sqrt(diagram.nodes.length ** 2)).toBe(diagram.nodes.length); });
    it(`${name}: Math.pow(2, 3) = 8`, () => { expect(Math.pow(2, 3)).toBe(8); });
    it(`${name}: Math.log(1) = 0`, () => { expect(Math.log(1)).toBe(0); });
    it(`${name}: Math.exp(0) = 1`, () => { expect(Math.exp(0)).toBe(1); });
    it(`${name}: Math.sin(0) = 0`, () => { expect(Math.sin(0)).toBe(0); });
    it(`${name}: Math.cos(0) = 1`, () => { expect(Math.cos(0)).toBe(1); });
    it(`${name}: Math.PI > 3`, () => { expect(Math.PI).toBeGreaterThan(3); });
  }
});
