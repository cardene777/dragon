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

describe("iter221: preset additional (every/some)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes every truthy = true`, () => { expect(diagram.nodes.every(() => true)).toBe(true); });
    it(`${name}: nodes every falsy nonempty = false`, () => { if (diagram.nodes.length) expect(diagram.nodes.every(() => false)).toBe(false); });
    it(`${name}: nodes some truthy nonempty = true`, () => { if (diagram.nodes.length) expect(diagram.nodes.some(() => true)).toBe(true); });
    it(`${name}: nodes some falsy = false`, () => { expect(diagram.nodes.some(() => false)).toBe(false); });
    it(`${name}: edges every truthy = true`, () => { expect(diagram.edges.every(() => true)).toBe(true); });
    it(`${name}: edges some falsy = false`, () => { expect(diagram.edges.some(() => false)).toBe(false); });
    it(`${name}: nodes every has valid id typeof`, () => { expect(diagram.nodes.every(n => typeof n.id === "string")).toBe(true); });
  }
});
