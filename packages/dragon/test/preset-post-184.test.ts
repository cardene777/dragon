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

describe("iter186: preset additional (frozen/sealed check)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: not frozen`, () => { expect(Object.isFrozen(diagram)).toBe(false); });
    it(`${name}: not sealed`, () => { expect(Object.isSealed(diagram)).toBe(false); });
    it(`${name}: is extensible`, () => { expect(Object.isExtensible(diagram)).toBe(true); });
    it(`${name}: id descriptor exists`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "id")).toBeDefined(); });
    it(`${name}: id enumerable`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "id")?.enumerable).toBe(true); });
    it(`${name}: id writable`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "id")?.writable).toBe(true); });
    it(`${name}: id configurable`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "id")?.configurable).toBe(true); });
  }
});
