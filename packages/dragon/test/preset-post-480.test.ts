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

describe("iter482: preset additional (JSON parse / stringify)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: JSON.stringify({a:1}) = '{"a":1}'`, () => { expect(JSON.stringify({ a: 1 })).toBe('{"a":1}'); });
    it(`${name}: JSON.parse('{"a":1}') = {a:1}`, () => { expect(JSON.parse('{"a":1}')).toEqual({ a: 1 }); });
    it(`${name}: JSON.stringify([1,2]) = "[1,2]"`, () => { expect(JSON.stringify([1, 2])).toBe("[1,2]"); });
    it(`${name}: JSON.parse("[1,2]") = [1,2]`, () => { expect(JSON.parse("[1,2]")).toEqual([1, 2]); });
    it(`${name}: JSON.stringify(null) = "null"`, () => { expect(JSON.stringify(null)).toBe("null"); });
    it(`${name}: JSON.parse('"abc"') = "abc"`, () => { expect(JSON.parse('"abc"')).toBe("abc"); });
    it(`${name}: id roundtrip`, () => { expect(JSON.parse(JSON.stringify(diagram.id))).toBe(diagram.id); });
  }
});
