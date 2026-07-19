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

describe("iter176: preset additional (encoded)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id encodeURI ok`, () => { expect(() => encodeURI(diagram.id)).not.toThrow(); });
    it(`${name}: id encodeURIComponent ok`, () => { expect(() => encodeURIComponent(diagram.id)).not.toThrow(); });
    it(`${name}: id decodeURI round-trip`, () => { expect(decodeURI(encodeURI(diagram.id))).toBe(diagram.id); });
    it(`${name}: id decodeURIComponent round-trip`, () => { expect(decodeURIComponent(encodeURIComponent(diagram.id))).toBe(diagram.id); });
    it(`${name}: id encodeURI truthy`, () => { expect(encodeURI(diagram.id)).toBeTruthy(); });
    it(`${name}: id encodeURIComponent length >= id length`, () => { expect(encodeURIComponent(diagram.id).length).toBeGreaterThanOrEqual(diagram.id.length); });
    it(`${name}: id encodeURI is string`, () => { expect(typeof encodeURI(diagram.id)).toBe("string"); });
  }
});
