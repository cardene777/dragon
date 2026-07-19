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

describe("iter251: preset additional (Array slice boundary)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes.slice(0) = nodes`, () => { expect(diagram.nodes.slice(0)).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice() = nodes`, () => { expect(diagram.nodes.slice()).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice(0, 0) = []`, () => { expect(diagram.nodes.slice(0, 0)).toEqual([]); });
    it(`${name}: nodes.slice(-0) = nodes`, () => { expect(diagram.nodes.slice(-0)).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice(length) = []`, () => { expect(diagram.nodes.slice(diagram.nodes.length)).toEqual([]); });
    it(`${name}: nodes.slice(-length) = nodes`, () => { expect(diagram.nodes.slice(-diagram.nodes.length)).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice not = nodes ref`, () => { expect(diagram.nodes.slice()).not.toBe(diagram.nodes); });
  }
});
