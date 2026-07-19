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

describe("iter227: preset additional (JSON round-trip)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: JSON parse stringify id`, () => { expect(JSON.parse(JSON.stringify(diagram)).id).toBe(diagram.id); });
    it(`${name}: JSON stringify parse nodes length`, () => { expect(JSON.parse(JSON.stringify(diagram)).nodes.length).toBe(diagram.nodes.length); });
    it(`${name}: JSON stringify parse edges length`, () => { expect(JSON.parse(JSON.stringify(diagram)).edges.length).toBe(diagram.edges.length); });
    it(`${name}: JSON stringify is string`, () => { expect(typeof JSON.stringify(diagram)).toBe("string"); });
    it(`${name}: JSON stringify not empty`, () => { expect(JSON.stringify(diagram).length).toBeGreaterThan(0); });
    it(`${name}: JSON stringify starts with {`, () => { expect(JSON.stringify(diagram).startsWith("{")).toBe(true); });
    it(`${name}: JSON stringify ends with }`, () => { expect(JSON.stringify(diagram).endsWith("}")).toBe(true); });
  }
});
