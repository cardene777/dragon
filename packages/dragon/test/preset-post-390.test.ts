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

describe("iter392: preset additional (Reflect API)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Reflect.get(d, "id") = id`, () => { expect(Reflect.get(diagram, "id")).toBe(diagram.id); });
    it(`${name}: Reflect.has(d, "nodes") = true`, () => { expect(Reflect.has(diagram, "nodes")).toBe(true); });
    it(`${name}: Reflect.ownKeys(d) length >= 3`, () => { expect(Reflect.ownKeys(diagram).length).toBeGreaterThanOrEqual(3); });
    it(`${name}: Reflect.apply((x)=>x, null, [id]) = id`, () => { expect(Reflect.apply((x: string) => x, null, [diagram.id])).toBe(diagram.id); });
    it(`${name}: Reflect.getPrototypeOf(d) = Object.prototype`, () => { expect(Reflect.getPrototypeOf(diagram)).toBe(Object.prototype); });
    it(`${name}: Reflect.isExtensible({...d}) = true`, () => { expect(Reflect.isExtensible({ ...diagram })).toBe(true); });
    it(`${name}: Reflect.construct(Array, [3]).length = 3`, () => { expect(Reflect.construct(Array, [3]).length).toBe(3); });
  }
});
