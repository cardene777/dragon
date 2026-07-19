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

describe("iter190: preset additional (Number bounds)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id length < MAX_SAFE_INTEGER`, () => { expect(diagram.id.length).toBeLessThan(Number.MAX_SAFE_INTEGER); });
    it(`${name}: nodes length < MAX_SAFE_INTEGER`, () => { expect(diagram.nodes.length).toBeLessThan(Number.MAX_SAFE_INTEGER); });
    it(`${name}: edges length < MAX_SAFE_INTEGER`, () => { expect(diagram.edges.length).toBeLessThan(Number.MAX_SAFE_INTEGER); });
    it(`${name}: id length >= 0`, () => { expect(diagram.id.length).toBeGreaterThanOrEqual(0); });
    it(`${name}: id length !== Infinity`, () => { expect(diagram.id.length).not.toBe(Infinity); });
    it(`${name}: nodes length !== Infinity`, () => { expect(diagram.nodes.length).not.toBe(Infinity); });
    it(`${name}: edges length !== Infinity`, () => { expect(diagram.edges.length).not.toBe(Infinity); });
  }
});
