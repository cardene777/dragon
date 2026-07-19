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

describe("iter136: preset additional 14 axis (Object shape)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: is object`, () => { expect(typeof diagram).toBe("object"); });
    it(`${name}: not null`, () => { expect(diagram).not.toBeNull(); });
    it(`${name}: has id own`, () => { expect(Object.prototype.hasOwnProperty.call(diagram, "id")).toBe(true); });
    it(`${name}: has nodes own`, () => { expect(Object.prototype.hasOwnProperty.call(diagram, "nodes")).toBe(true); });
    it(`${name}: has edges own`, () => { expect(Object.prototype.hasOwnProperty.call(diagram, "edges")).toBe(true); });
    it(`${name}: keys include id`, () => { expect(Object.keys(diagram)).toContain("id"); });
    it(`${name}: keys include nodes`, () => { expect(Object.keys(diagram)).toContain("nodes"); });
  }
});
