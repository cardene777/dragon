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

describe("iter180: preset additional (existential/hasOwn)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Object.hasOwn id`, () => { expect(Object.hasOwn(diagram as object, "id")).toBe(true); });
    it(`${name}: Object.hasOwn nodes`, () => { expect(Object.hasOwn(diagram as object, "nodes")).toBe(true); });
    it(`${name}: Object.hasOwn edges`, () => { expect(Object.hasOwn(diagram as object, "edges")).toBe(true); });
    it(`${name}: Object.hasOwn xxx not`, () => { expect(Object.hasOwn(diagram as object, "__xxx__")).toBe(false); });
    it(`${name}: id propertyIsEnumerable`, () => { expect(Object.prototype.propertyIsEnumerable.call(diagram, "id")).toBe(true); });
    it(`${name}: nodes propertyIsEnumerable`, () => { expect(Object.prototype.propertyIsEnumerable.call(diagram, "nodes")).toBe(true); });
    it(`${name}: edges propertyIsEnumerable`, () => { expect(Object.prototype.propertyIsEnumerable.call(diagram, "edges")).toBe(true); });
  }
});
