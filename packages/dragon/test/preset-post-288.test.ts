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

describe("iter290: preset additional (Array.at negative index) 🎊 75k milestone", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes at(-length) = first if nonempty`, () => { if (diagram.nodes.length) expect(diagram.nodes.at(-diagram.nodes.length)).toBe(diagram.nodes[0]); });
    it(`${name}: nodes at(-length-1) = undefined`, () => { expect(diagram.nodes.at(-diagram.nodes.length - 1)).toBeUndefined(); });
    it(`${name}: id at(-length) = first if nonempty`, () => { if (diagram.id.length) expect(diagram.id.at(-diagram.id.length)).toBe(diagram.id[0]); });
    it(`${name}: id at(-length-1) = undefined`, () => { expect(diagram.id.at(-diagram.id.length - 1)).toBeUndefined(); });
    it(`${name}: edges at(-length) = first if nonempty`, () => { if (diagram.edges.length) expect(diagram.edges.at(-diagram.edges.length)).toBe(diagram.edges[0]); });
    it(`${name}: nodes at() = at(0)`, () => { expect(diagram.nodes.at()).toBe(diagram.nodes.at(0)); });
    it(`${name}: nodes at(Infinity) = undefined`, () => { expect(diagram.nodes.at(Infinity)).toBeUndefined(); });
  }
});
