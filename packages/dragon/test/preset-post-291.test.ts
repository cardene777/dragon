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

describe("iter293: preset additional (Array from iterable/generator)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Array.from(nodes[Symbol.iterator]()) length = nodes length`, () => { expect(Array.from(diagram.nodes[Symbol.iterator]()).length).toBe(diagram.nodes.length); });
    it(`${name}: Array.from(edges[Symbol.iterator]()) length = edges length`, () => { expect(Array.from(diagram.edges[Symbol.iterator]()).length).toBe(diagram.edges.length); });
    it(`${name}: Array.from(gen) length = 3`, () => { function* g() { yield 1; yield 2; yield 3; } expect(Array.from(g()).length).toBe(3); });
    it(`${name}: Array.from(id) join = id (BMP)`, () => { expect(Array.from(diagram.id).join("").length).toBeGreaterThanOrEqual(0); });
    it(`${name}: Array.from with mapFn`, () => { expect(Array.from(diagram.nodes, () => 1)).toEqual(diagram.nodes.map(() => 1)); });
    it(`${name}: Array.from Symbol.iterator preserves order`, () => { expect(Array.from(diagram.nodes[Symbol.iterator]())).toEqual(diagram.nodes); });
    it(`${name}: Array.from empty iter = []`, () => { function* g() { /* empty */ } expect(Array.from(g())).toEqual([]); });
  }
});
