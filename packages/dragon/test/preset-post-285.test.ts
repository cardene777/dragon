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

describe("iter287: preset additional (Array indexOf/lastIndexOf boundary)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes indexOf undefined = -1`, () => { expect(diagram.nodes.indexOf(undefined as never)).toBe(-1); });
    it(`${name}: nodes indexOf null = -1`, () => { expect(diagram.nodes.indexOf(null as never)).toBe(-1); });
    it(`${name}: nodes lastIndexOf undefined = -1`, () => { expect(diagram.nodes.lastIndexOf(undefined as never)).toBe(-1); });
    it(`${name}: nodes lastIndexOf null = -1`, () => { expect(diagram.nodes.lastIndexOf(null as never)).toBe(-1); });
    it(`${name}: nodes indexOf first if nonempty = 0`, () => { if (diagram.nodes.length) expect(diagram.nodes.indexOf(diagram.nodes[0])).toBe(0); });
    it(`${name}: nodes lastIndexOf last if nonempty = length-1`, () => { if (diagram.nodes.length) expect(diagram.nodes.lastIndexOf(diagram.nodes[diagram.nodes.length - 1])).toBe(diagram.nodes.length - 1); });
    it(`${name}: nodes indexOf with fromIndex > length = -1`, () => { expect(diagram.nodes.indexOf({} as never, 999)).toBe(-1); });
  }
});
