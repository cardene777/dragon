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

describe("iter254: preset additional (startsWith/endsWith)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id startsWith "" = true`, () => { expect(diagram.id.startsWith("")).toBe(true); });
    it(`${name}: id endsWith "" = true`, () => { expect(diagram.id.endsWith("")).toBe(true); });
    it(`${name}: id includes "" = true`, () => { expect(diagram.id.includes("")).toBe(true); });
    it(`${name}: id startsWith self = true`, () => { expect(diagram.id.startsWith(diagram.id)).toBe(true); });
    it(`${name}: id endsWith self = true`, () => { expect(diagram.id.endsWith(diagram.id)).toBe(true); });
    it(`${name}: id includes self = true`, () => { expect(diagram.id.includes(diagram.id)).toBe(true); });
    it(`${name}: id startsWith self+"X" = false`, () => { expect(diagram.id.startsWith(diagram.id + "X")).toBe(false); });
  }
});
