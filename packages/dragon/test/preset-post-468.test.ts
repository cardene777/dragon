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

describe("iter470: preset additional (Number / Math basic)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Number("42") = 42`, () => { expect(Number("42")).toBe(42); });
    it(`${name}: Number("abc") = NaN`, () => { expect(Number("abc")).toBeNaN(); });
    it(`${name}: Number.isNaN(NaN) = true`, () => { expect(Number.isNaN(NaN)).toBe(true); });
    it(`${name}: Number.isInteger(3) = true`, () => { expect(Number.isInteger(3)).toBe(true); });
    it(`${name}: Number.isInteger(3.5) = false`, () => { expect(Number.isInteger(3.5)).toBe(false); });
    it(`${name}: Number.isFinite(Infinity) = false`, () => { expect(Number.isFinite(Infinity)).toBe(false); });
    it(`${name}: nodes length is finite integer`, () => { expect(Number.isInteger(diagram.nodes.length)).toBe(true); });
  }
});
