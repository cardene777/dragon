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

describe("iter127: preset additional 11 axis", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id no colon`, () => { expect(diagram.id).not.toContain(":"); });
    it(`${name}: id no semicolon`, () => { expect(diagram.id).not.toContain(";"); });
    it(`${name}: id no comma`, () => { expect(diagram.id).not.toContain(","); });
    it(`${name}: id no equals`, () => { expect(diagram.id).not.toContain("="); });
    it(`${name}: id no bracket open`, () => { expect(diagram.id).not.toContain("["); });
    it(`${name}: id no bracket close`, () => { expect(diagram.id).not.toContain("]"); });
    it(`${name}: id no dollar`, () => { expect(diagram.id).not.toContain("$"); });
  }
});
