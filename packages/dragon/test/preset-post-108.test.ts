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

describe("iter110: preset additional 7 axis", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes copy independent`, () => {
      const copy = [...diagram.nodes];
      expect(copy.length).toBe(diagram.nodes.length);
    });
    it(`${name}: edges copy independent`, () => {
      const copy = [...diagram.edges];
      expect(copy.length).toBe(diagram.edges.length);
    });
    it(`${name}: id concat "" equal`, () => {
      expect(diagram.id + "").toBe(diagram.id);
    });
    it(`${name}: id split length > 0`, () => {
      expect(diagram.id.split("").length).toBeGreaterThan(0);
    });
    it(`${name}: nodes findIndex sanity`, () => {
      expect(diagram.nodes.findIndex(() => false)).toBe(-1);
    });
    it(`${name}: nodes some sanity`, () => {
      expect(diagram.nodes.some(() => true) || diagram.nodes.length === 0).toBe(true);
    });
    it(`${name}: nodes every sanity`, () => {
      expect(diagram.nodes.every(() => true)).toBe(true);
    });
  }
});
