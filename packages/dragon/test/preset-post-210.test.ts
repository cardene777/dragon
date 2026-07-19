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

describe("iter212: preset additional (flat/flatMap/at)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes flat 0 = nodes`, () => { expect(diagram.nodes.flat(0)).toEqual(diagram.nodes); });
    it(`${name}: nodes flatMap identity = nodes`, () => { expect(diagram.nodes.flatMap(n => [n])).toEqual(diagram.nodes); });
    it(`${name}: nodes flatMap empty = []`, () => { expect(diagram.nodes.flatMap(() => [])).toEqual([]); });
    it(`${name}: nodes at 0 nonempty = nodes[0]`, () => { if (diagram.nodes.length) expect(diagram.nodes.at(0)).toBe(diagram.nodes[0]); });
    it(`${name}: nodes at -1 nonempty = last`, () => { if (diagram.nodes.length) expect(diagram.nodes.at(-1)).toBe(diagram.nodes[diagram.nodes.length - 1]); });
    it(`${name}: nodes at length = undefined`, () => { expect(diagram.nodes.at(diagram.nodes.length)).toBeUndefined(); });
    it(`${name}: id at 0 nonempty = first char`, () => { if (diagram.id.length) expect(diagram.id.at(0)).toBe(diagram.id[0]); });
  }
});
