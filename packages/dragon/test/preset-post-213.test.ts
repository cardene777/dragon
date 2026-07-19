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

describe("iter215: preset additional (Object.entries/keys/values)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Object.keys length = entries length`, () => { expect(Object.keys(diagram).length).toBe(Object.entries(diagram).length); });
    it(`${name}: Object.values length = entries length`, () => { expect(Object.values(diagram).length).toBe(Object.entries(diagram).length); });
    it(`${name}: Object.fromEntries preserves id`, () => { expect((Object.fromEntries(Object.entries(diagram)) as { id: string }).id).toBe(diagram.id); });
    it(`${name}: Object.keys contains id/nodes/edges`, () => { const k = Object.keys(diagram); expect(k).toContain("id"); expect(k).toContain("nodes"); expect(k).toContain("edges"); });
    it(`${name}: Object.entries each key is string`, () => { for (const [k] of Object.entries(diagram)) expect(typeof k).toBe("string"); });
    it(`${name}: Object.keys idempotent`, () => { expect(Object.keys(diagram)).toEqual(Object.keys(diagram)); });
    it(`${name}: Object.entries idempotent length`, () => { expect(Object.entries(diagram).length).toBe(Object.entries(diagram).length); });
  }
});
