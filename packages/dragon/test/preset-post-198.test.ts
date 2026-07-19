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

describe("iter200: preset additional (concatenation) 🎉 iter200 milestone", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id concat id x2`, () => { expect(diagram.id.concat(diagram.id).length).toBe(diagram.id.length * 2); });
    it(`${name}: id + id x2`, () => { expect((diagram.id + diagram.id).length).toBe(diagram.id.length * 2); });
    it(`${name}: nodes concat empty = nodes`, () => { expect(diagram.nodes.concat().length).toBe(diagram.nodes.length); });
    it(`${name}: edges concat empty = edges`, () => { expect(diagram.edges.concat().length).toBe(diagram.edges.length); });
    it(`${name}: nodes concat nodes = 2x`, () => { expect(diagram.nodes.concat(diagram.nodes).length).toBe(diagram.nodes.length * 2); });
    it(`${name}: id concat empty = id`, () => { expect(diagram.id.concat("")).toBe(diagram.id); });
    it(`${name}: "" concat id = id`, () => { expect("".concat(diagram.id)).toBe(diagram.id); });
  }
});
