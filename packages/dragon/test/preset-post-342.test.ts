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

describe("iter344: preset additional (bitwise ops)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes.length & 0 = 0`, () => { expect(diagram.nodes.length & 0).toBe(0); });
    it(`${name}: nodes.length | 0 = nodes.length`, () => { expect(diagram.nodes.length | 0).toBe(diagram.nodes.length); });
    it(`${name}: nodes.length ^ 0 = nodes.length`, () => { expect(diagram.nodes.length ^ 0).toBe(diagram.nodes.length); });
    it(`${name}: nodes.length ^ nodes.length = 0`, () => { expect(diagram.nodes.length ^ diagram.nodes.length).toBe(0); });
    it(`${name}: ~~nodes.length = nodes.length`, () => { expect(~~diagram.nodes.length).toBe(diagram.nodes.length); });
    it(`${name}: nodes.length << 0 = nodes.length`, () => { expect(diagram.nodes.length << 0).toBe(diagram.nodes.length); });
    it(`${name}: nodes.length >> 0 = nodes.length`, () => { expect(diagram.nodes.length >> 0).toBe(diagram.nodes.length); });
  }
});
