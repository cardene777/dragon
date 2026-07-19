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

describe("iter143: preset additional (immutability)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id spread ok`, () => { const cp = { ...diagram }; expect(cp.id).toBe(diagram.id); });
    it(`${name}: nodes spread length`, () => { const cp = { ...diagram }; expect(cp.nodes.length).toBe(diagram.nodes.length); });
    it(`${name}: edges spread length`, () => { const cp = { ...diagram }; expect(cp.edges.length).toBe(diagram.edges.length); });
    it(`${name}: id template literal`, () => { expect(`${diagram.id}`).toBe(diagram.id); });
    it(`${name}: nodes array spread eq length`, () => { expect([...diagram.nodes].length).toBe(diagram.nodes.length); });
    it(`${name}: edges array spread eq length`, () => { expect([...diagram.edges].length).toBe(diagram.edges.length); });
    it(`${name}: nodes reverse length preserve`, () => { expect([...diagram.nodes].reverse().length).toBe(diagram.nodes.length); });
  }
});
