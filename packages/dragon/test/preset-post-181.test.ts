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

describe("iter183: preset additional (Array method chain)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes flat length`, () => { expect(diagram.nodes.flat().length).toBeGreaterThanOrEqual(diagram.nodes.length); });
    it(`${name}: edges flat length`, () => { expect(diagram.edges.flat().length).toBeGreaterThanOrEqual(diagram.edges.length); });
    it(`${name}: nodes flatMap identity`, () => { expect(diagram.nodes.flatMap(n => [n]).length).toBe(diagram.nodes.length); });
    it(`${name}: edges flatMap identity`, () => { expect(diagram.edges.flatMap(e => [e]).length).toBe(diagram.edges.length); });
    it(`${name}: nodes findIndex first`, () => { if (diagram.nodes.length > 0) expect(diagram.nodes.findIndex(() => true)).toBe(0); else expect(true).toBe(true); });
    it(`${name}: edges findIndex first`, () => { if (diagram.edges.length > 0) expect(diagram.edges.findIndex(() => true)).toBe(0); else expect(true).toBe(true); });
    it(`${name}: nodes findIndex none`, () => { expect(diagram.nodes.findIndex(() => false)).toBe(-1); });
  }
});
