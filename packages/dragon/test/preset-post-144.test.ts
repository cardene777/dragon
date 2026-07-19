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

describe("iter146: preset additional (deep equal)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes deep eq self`, () => { expect(diagram.nodes).toEqual(diagram.nodes); });
    it(`${name}: edges deep eq self`, () => { expect(diagram.edges).toEqual(diagram.edges); });
    it(`${name}: id deep eq self`, () => { expect(diagram.id).toEqual(diagram.id); });
    it(`${name}: diagram deep eq self`, () => { expect(diagram).toEqual(diagram); });
    it(`${name}: nodes strict eq self`, () => { expect(diagram.nodes).toStrictEqual(diagram.nodes); });
    it(`${name}: edges strict eq self`, () => { expect(diagram.edges).toStrictEqual(diagram.edges); });
    it(`${name}: nodes shallow copy deep eq`, () => { expect([...diagram.nodes]).toEqual(diagram.nodes); });
  }
});
