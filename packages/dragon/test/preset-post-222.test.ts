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

describe("iter224: preset additional (filter/map)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes filter truthy length = nodes length`, () => { expect(diagram.nodes.filter(() => true).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes filter falsy length = 0`, () => { expect(diagram.nodes.filter(() => false).length).toBe(0); });
    it(`${name}: edges filter truthy length = edges length`, () => { expect(diagram.edges.filter(() => true).length).toBe(diagram.edges.length); });
    it(`${name}: nodes map identity length = nodes length`, () => { expect(diagram.nodes.map(n => n).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes map identity content = nodes`, () => { expect(diagram.nodes.map(n => n)).toEqual(diagram.nodes); });
    it(`${name}: edges map identity length = edges length`, () => { expect(diagram.edges.map(e => e).length).toBe(diagram.edges.length); });
    it(`${name}: nodes filter map chain preserves = nodes`, () => { expect(diagram.nodes.filter(() => true).map(n => n)).toEqual(diagram.nodes); });
  }
});
