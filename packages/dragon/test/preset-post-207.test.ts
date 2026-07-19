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

describe("iter209: preset additional (find/findIndex/includes)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes findIndex never = -1`, () => { expect(diagram.nodes.findIndex(() => false)).toBe(-1); });
    it(`${name}: nodes find never = undefined`, () => { expect(diagram.nodes.find(() => false)).toBeUndefined(); });
    it(`${name}: edges findIndex never = -1`, () => { expect(diagram.edges.findIndex(() => false)).toBe(-1); });
    it(`${name}: nodes findIndex always nonempty = 0`, () => { if (diagram.nodes.length) expect(diagram.nodes.findIndex(() => true)).toBe(0); });
    it(`${name}: nodes indexOf non-member = -1`, () => { expect(diagram.nodes.indexOf({} as never)).toBe(-1); });
    it(`${name}: nodes includes non-member = false`, () => { expect(diagram.nodes.includes({} as never)).toBe(false); });
    it(`${name}: nodes lastIndexOf non-member = -1`, () => { expect(diagram.nodes.lastIndexOf({} as never)).toBe(-1); });
  }
});
