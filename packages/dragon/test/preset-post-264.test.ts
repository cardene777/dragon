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

describe("iter266: preset additional (Object property descriptor) 🎊 100 PR merge milestone", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: getOwnPropertyDescriptor(id) not undefined`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "id")).not.toBeUndefined(); });
    it(`${name}: getOwnPropertyDescriptor(nodes) not undefined`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "nodes")).not.toBeUndefined(); });
    it(`${name}: getOwnPropertyDescriptor(nonexist) undefined`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "___NOTEXIST___")).toBeUndefined(); });
    it(`${name}: getOwnPropertyNames contains id`, () => { expect(Object.getOwnPropertyNames(diagram)).toContain("id"); });
    it(`${name}: getOwnPropertyNames contains nodes`, () => { expect(Object.getOwnPropertyNames(diagram)).toContain("nodes"); });
    it(`${name}: getOwnPropertyNames length >= 3`, () => { expect(Object.getOwnPropertyNames(diagram).length).toBeGreaterThanOrEqual(3); });
    it(`${name}: getOwnPropertyDescriptors returns object`, () => { expect(typeof Object.getOwnPropertyDescriptors(diagram)).toBe("object"); });
  }
});
