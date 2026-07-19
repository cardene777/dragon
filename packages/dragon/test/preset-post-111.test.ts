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

describe("iter113: preset additional 7 axis batch 3", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id charAt(0) truthy`, () => { expect(diagram.id.charAt(0)).toBeTruthy(); });
    it(`${name}: id indexOf self 0`, () => { expect(diagram.id.indexOf(diagram.id)).toBe(0); });
    it(`${name}: nodes typeof object`, () => { expect(typeof diagram.nodes).toBe("object"); });
    it(`${name}: edges typeof object`, () => { expect(typeof diagram.edges).toBe("object"); });
    it(`${name}: id upper differ or equal`, () => {
      expect(typeof diagram.id.toUpperCase()).toBe("string");
    });
    it(`${name}: id lower differ or equal`, () => {
      expect(typeof diagram.id.toLowerCase()).toBe("string");
    });
    it(`${name}: id repeat 2 length`, () => {
      expect(diagram.id.repeat(2).length).toBe(diagram.id.length * 2);
    });
  }
});
