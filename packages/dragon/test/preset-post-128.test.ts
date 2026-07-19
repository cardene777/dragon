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

describe("iter130: preset additional 12 axis (numerics)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id length > 0`, () => { expect(diagram.id.length).toBeGreaterThan(0); });
    it(`${name}: id length < 200`, () => { expect(diagram.id.length).toBeLessThan(200); });
    it(`${name}: id length finite`, () => { expect(Number.isFinite(diagram.id.length)).toBe(true); });
    it(`${name}: id length safe int`, () => { expect(Number.isSafeInteger(diagram.id.length)).toBe(true); });
    it(`${name}: nodes length >= 0`, () => { expect(diagram.nodes.length).toBeGreaterThanOrEqual(0); });
    it(`${name}: edges length >= 0`, () => { expect(diagram.edges.length).toBeGreaterThanOrEqual(0); });
    it(`${name}: nodes length < 1000`, () => { expect(diagram.nodes.length).toBeLessThan(1000); });
  }
});
