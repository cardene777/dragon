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

describe("iter120: preset additional 9 axis", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: id no space`, () => { expect(diagram.id).not.toContain(" "); });
    it(`${name}: id no newline`, () => { expect(diagram.id).not.toContain("\n"); });
    it(`${name}: id no null char`, () => { expect(diagram.id).not.toContain("\0"); });
    it(`${name}: id matches identifier`, () => { expect(diagram.id).toMatch(/^[a-zA-Z][a-zA-Z0-9_-]*$/); });
    it(`${name}: nodes not string`, () => { expect(typeof diagram.nodes).not.toBe("string"); });
    it(`${name}: edges not string`, () => { expect(typeof diagram.edges).not.toBe("string"); });
    it(`${name}: id length integer`, () => { expect(Number.isInteger(diagram.id.length)).toBe(true); });
  }
});
