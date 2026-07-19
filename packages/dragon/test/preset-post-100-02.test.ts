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

describe("iter106: preset add invariants", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes not undefined`, () => { expect(diagram.nodes).not.toBeUndefined(); });
    it(`${name}: edges not undefined`, () => { expect(diagram.edges).not.toBeUndefined(); });
    it(`${name}: id not undefined`, () => { expect(diagram.id).not.toBeUndefined(); });
    it(`${name}: id not null`, () => { expect(diagram.id).not.toBeNull(); });
    it(`${name}: nodes not null`, () => { expect(diagram.nodes).not.toBeNull(); });
    it(`${name}: JSON size > 5`, () => { expect(JSON.stringify(diagram).length).toBeGreaterThan(5); });
    it(`${name}: id length > 0`, () => { expect(diagram.id.length).toBeGreaterThan(0); });
  }
});
