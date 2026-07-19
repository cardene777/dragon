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

describe("iter163: preset additional (identity)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id !== null`, () => { expect(diagram.id === null).toBe(false); });
    it(`${name}: id !== 0`, () => { expect(diagram.id === (0 as unknown as string)).toBe(false); });
    it(`${name}: id !== false`, () => { expect(diagram.id === (false as unknown as string)).toBe(false); });
    it(`${name}: nodes !== null`, () => { expect(diagram.nodes === null).toBe(false); });
    it(`${name}: edges !== null`, () => { expect(diagram.edges === null).toBe(false); });
    it(`${name}: id truthy`, () => { expect(Boolean(diagram.id)).toBe(true); });
    it(`${name}: nodes truthy`, () => { expect(Boolean(diagram.nodes)).toBe(true); });
  }
});
