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

describe("iter248: preset additional (Array iterator)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: [...nodes.keys()].length = nodes length`, () => { expect([...diagram.nodes.keys()].length).toBe(diagram.nodes.length); });
    it(`${name}: [...nodes.values()].length = nodes length`, () => { expect([...diagram.nodes.values()].length).toBe(diagram.nodes.length); });
    it(`${name}: [...nodes.entries()].length = nodes length`, () => { expect([...diagram.nodes.entries()].length).toBe(diagram.nodes.length); });
    it(`${name}: [...edges.keys()].length = edges length`, () => { expect([...diagram.edges.keys()].length).toBe(diagram.edges.length); });
    it(`${name}: [...edges.values()].length = edges length`, () => { expect([...diagram.edges.values()].length).toBe(diagram.edges.length); });
    it(`${name}: [...nodes.values()] equals nodes`, () => { expect([...diagram.nodes.values()]).toEqual(diagram.nodes); });
    it(`${name}: [...nodes.keys()] is index array`, () => { expect([...diagram.nodes.keys()]).toEqual(diagram.nodes.map((_, i) => i)); });
  }
});
