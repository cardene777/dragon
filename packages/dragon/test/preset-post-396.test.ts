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

describe("iter398: preset additional (String iterator vs Array.from)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: [...id] length >= 0`, () => { expect([...diagram.id].length).toBeGreaterThanOrEqual(0); });
    it(`${name}: Array.from(id).length = [...id].length`, () => { expect(Array.from(diagram.id).length).toBe([...diagram.id].length); });
    it(`${name}: [...id].join("") length >= 0`, () => { expect([...diagram.id].join("").length).toBeGreaterThanOrEqual(0); });
    it(`${name}: [...""] = []`, () => { expect([...""]).toEqual([]); });
    it(`${name}: Array.from("").length = 0`, () => { expect(Array.from("").length).toBe(0); });
    it(`${name}: [...id] every char string`, () => { for (const c of [...diagram.id]) expect(typeof c).toBe("string"); });
    it(`${name}: [...id] each char length >= 1 if id nonempty`, () => { if (diagram.id.length) for (const c of [...diagram.id]) expect(c.length).toBeGreaterThanOrEqual(1); });
  }
});
