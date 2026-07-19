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

describe("iter156: preset additional (regex-like)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id matches non-empty`, () => { expect(diagram.id).toMatch(/./); });
    it(`${name}: id matches printable`, () => { expect(diagram.id).toMatch(/[\x20-\x7e]/); });
    it(`${name}: id no double dash`, () => { expect(diagram.id.includes("--")).toBe(false); });
    it(`${name}: id not start dash`, () => { expect(diagram.id.startsWith("-")).toBe(false); });
    it(`${name}: id not end dash`, () => { expect(diagram.id.endsWith("-")).toBe(false); });
    it(`${name}: id char at 0 defined`, () => { expect(diagram.id.charAt(0)).toBeDefined(); });
    it(`${name}: id char at end defined`, () => { expect(diagram.id.charAt(diagram.id.length - 1)).toBeDefined(); });
  }
});
