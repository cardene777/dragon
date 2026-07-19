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

describe("iter166: preset additional (repeat/pad)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id repeat 1 = id`, () => { expect(diagram.id.repeat(1)).toBe(diagram.id); });
    it(`${name}: id repeat 0 = empty`, () => { expect(diagram.id.repeat(0)).toBe(""); });
    it(`${name}: id repeat 2 length`, () => { expect(diagram.id.repeat(2).length).toBe(diagram.id.length * 2); });
    it(`${name}: id padStart no-op`, () => { expect(diagram.id.padStart(diagram.id.length, "x")).toBe(diagram.id); });
    it(`${name}: id padEnd no-op`, () => { expect(diagram.id.padEnd(diagram.id.length, "x")).toBe(diagram.id); });
    it(`${name}: id padStart bigger length`, () => { expect(diagram.id.padStart(diagram.id.length + 3, "x").length).toBe(diagram.id.length + 3); });
    it(`${name}: id padEnd bigger length`, () => { expect(diagram.id.padEnd(diagram.id.length + 3, "x").length).toBe(diagram.id.length + 3); });
  }
});
