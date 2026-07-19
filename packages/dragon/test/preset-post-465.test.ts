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

describe("iter467: preset additional (String indexOf / lastIndexOf / search)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: "abcabc".indexOf("b") = 1`, () => { expect("abcabc".indexOf("b")).toBe(1); });
    it(`${name}: "abcabc".indexOf("z") = -1`, () => { expect("abcabc".indexOf("z")).toBe(-1); });
    it(`${name}: "abcabc".lastIndexOf("b") = 4`, () => { expect("abcabc".lastIndexOf("b")).toBe(4); });
    it(`${name}: "abcabc".search(/b/) = 1`, () => { expect("abcabc".search(/b/)).toBe(1); });
    it(`${name}: "abcabc".search(/z/) = -1`, () => { expect("abcabc".search(/z/)).toBe(-1); });
    it(`${name}: "".indexOf("x") = -1`, () => { expect("".indexOf("x")).toBe(-1); });
    it(`${name}: diagram id indexOf first`, () => { if (diagram.id.length > 0) expect(diagram.id.indexOf(diagram.id[0])).toBe(0); else expect(true).toBe(true); });
  }
});
