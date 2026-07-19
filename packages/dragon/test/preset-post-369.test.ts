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

describe("iter371: preset additional (Array reduce accumulator)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes.reduce with 0 initial = length`, () => { expect(diagram.nodes.reduce((a) => a + 1, 0)).toBe(diagram.nodes.length); });
    it(`${name}: nodes.reduce with {} initial = obj`, () => { expect(typeof diagram.nodes.reduce((a) => a, {})).toBe("object"); });
    it(`${name}: nodes.reduce with [] initial = array`, () => { expect(Array.isArray(diagram.nodes.reduce<unknown[]>((a) => a, []))).toBe(true); });
    it(`${name}: [].reduce with 5 initial = 5`, () => { expect(([] as number[]).reduce((a) => a + 1, 5)).toBe(5); });
    it(`${name}: nodes.reduce with "x" initial = string`, () => { expect(typeof diagram.nodes.reduce((a) => a, "x")).toBe("string"); });
    it(`${name}: nodes.reduce with 100 initial = 100 + length`, () => { expect(diagram.nodes.reduce((a) => a + 1, 100)).toBe(100 + diagram.nodes.length); });
    it(`${name}: nodes.reduceRight with 0 initial = length`, () => { expect(diagram.nodes.reduceRight((a) => a + 1, 0)).toBe(diagram.nodes.length); });
  }
});
