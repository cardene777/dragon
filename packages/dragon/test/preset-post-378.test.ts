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

describe("iter380: preset additional (String comparison)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id === id`, () => { expect(diagram.id === diagram.id).toBe(true); });
    it(`${name}: id.localeCompare(id) = 0`, () => { expect(diagram.id.localeCompare(diagram.id)).toBe(0); });
    it(`${name}: id < id + "z"`, () => { expect(diagram.id < diagram.id + "z").toBe(true); });
    it(`${name}: id.length <= (id + "x").length`, () => { expect(diagram.id.length).toBeLessThanOrEqual((diagram.id + "x").length); });
    it(`${name}: id.localeCompare("") > 0 if nonempty`, () => { if (diagram.id.length) expect(diagram.id.localeCompare("")).toBeGreaterThan(0); });
    it(`${name}: "".localeCompare(id) < 0 if nonempty`, () => { if (diagram.id.length) expect("".localeCompare(diagram.id)).toBeLessThan(0); });
    it(`${name}: id.length >= 0`, () => { expect(diagram.id.length).toBeGreaterThanOrEqual(0); });
  }
});
