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

describe("iter359: preset additional (JSON replacer/reviver) 🎊 100k 前哨", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: JSON.stringify with null replacer = default`, () => { expect(JSON.stringify(diagram, null)).toBe(JSON.stringify(diagram)); });
    it(`${name}: JSON.stringify with [] whitelist = "{}"`, () => { expect(JSON.stringify(diagram, [])).toBe("{}"); });
    it(`${name}: JSON.stringify with ["id"] contains id`, () => { expect(JSON.stringify(diagram, ["id"])).toContain(diagram.id); });
    it(`${name}: JSON.stringify with replacer fn skip = undefined`, () => { expect(JSON.stringify(diagram, () => undefined)).toBeUndefined(); });
    it(`${name}: JSON.parse with reviver = value`, () => { const r = JSON.parse(JSON.stringify(diagram), (_, v) => v); expect(r.id).toBe(diagram.id); });
    it(`${name}: JSON.parse reviver skip`, () => { const r = JSON.parse('{"a":1,"b":2}', (k, v) => k === "a" ? undefined : v); expect(r).toEqual({ b: 2 }); });
    it(`${name}: JSON.stringify indent 4 has 4 spaces`, () => { expect(JSON.stringify(diagram, null, 4)).toContain("    "); });
  }
});
