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

describe("iter173: preset additional (chained ops)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id trim+lower length`, () => { expect(diagram.id.trim().toLowerCase().length).toBe(diagram.id.length); });
    it(`${name}: id split+join =`, () => { expect(diagram.id.split("").join("")).toBe(diagram.id); });
    it(`${name}: id split-join-hyphen`, () => { expect(diagram.id.split("-").join("-")).toBe(diagram.id); });
    it(`${name}: id substring 0 = self`, () => { expect(diagram.id.substring(0, diagram.id.length)).toBe(diagram.id); });
    it(`${name}: id slice 0 = self`, () => { expect(diagram.id.slice(0)).toBe(diagram.id); });
    it(`${name}: id slice 0 to end = self`, () => { expect(diagram.id.slice(0, diagram.id.length)).toBe(diagram.id); });
    it(`${name}: nodes slice 0 length`, () => { expect(diagram.nodes.slice(0).length).toBe(diagram.nodes.length); });
  }
});
