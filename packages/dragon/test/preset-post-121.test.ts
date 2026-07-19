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

describe("iter123: preset additional 10 axis", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id no CR`, () => { expect(diagram.id).not.toContain("\r"); });
    it(`${name}: id no backslash`, () => { expect(diagram.id).not.toContain("\\"); });
    it(`${name}: id no quote`, () => { expect(diagram.id).not.toContain('"'); });
    it(`${name}: id no apostrophe`, () => { expect(diagram.id).not.toContain("'"); });
    it(`${name}: id no lt`, () => { expect(diagram.id).not.toContain("<"); });
    it(`${name}: id no gt`, () => { expect(diagram.id).not.toContain(">"); });
    it(`${name}: id no tab`, () => { expect(diagram.id).not.toContain("\t"); });
  }
});
