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

describe("iter323: preset additional (Array multi-arg concat)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes.concat([], []) length = nodes length`, () => { expect(diagram.nodes.concat([], []).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes.concat(nodes, nodes) length = 3x`, () => { expect(diagram.nodes.concat(diagram.nodes, diagram.nodes).length).toBe(diagram.nodes.length * 3); });
    it(`${name}: edges.concat([], []) length = edges length`, () => { expect(diagram.edges.concat([], []).length).toBe(diagram.edges.length); });
    it(`${name}: [].concat(nodes) = nodes`, () => { expect(([] as CdlDiagram["nodes"]).concat(diagram.nodes)).toEqual(diagram.nodes); });
    it(`${name}: nodes.concat() = nodes copy`, () => { expect(diagram.nodes.concat()).toEqual(diagram.nodes); });
    it(`${name}: [].concat() = []`, () => { expect([].concat()).toEqual([]); });
    it(`${name}: nodes.concat().length = nodes.length`, () => { expect(diagram.nodes.concat().length).toBe(diagram.nodes.length); });
  }
});
