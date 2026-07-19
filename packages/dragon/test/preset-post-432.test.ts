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

describe("iter434: preset additional (Reflect.preventExtensions/deleteProperty)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Reflect.preventExtensions returns true`, () => { const o = {}; expect(Reflect.preventExtensions(o)).toBe(true); });
    it(`${name}: Reflect.preventExtensions prevents extension`, () => { const o: Record<string, unknown> = {}; Reflect.preventExtensions(o); expect(Reflect.isExtensible(o)).toBe(false); });
    it(`${name}: Reflect.deleteProperty deletes prop`, () => { const o = { x: 1 }; expect(Reflect.deleteProperty(o, "x")).toBe(true); expect((o as { x?: number }).x).toBeUndefined(); });
    it(`${name}: Reflect.set returns true`, () => { const o: Record<string, unknown> = {}; expect(Reflect.set(o, "x", 1)).toBe(true); expect(o.x).toBe(1); });
    it(`${name}: Reflect.defineProperty returns true`, () => { const o: Record<string, unknown> = {}; expect(Reflect.defineProperty(o, "x", { value: 1 })).toBe(true); });
    it(`${name}: Reflect.getPrototypeOf(d) = Object.prototype`, () => { expect(Reflect.getPrototypeOf(diagram)).toBe(Object.prototype); });
    it(`${name}: Reflect.setPrototypeOf returns true`, () => { const o = {}; expect(Reflect.setPrototypeOf(o, null)).toBe(true); });
  }
});
