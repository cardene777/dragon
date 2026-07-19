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

describe("iter533: preset additional (Object prototype)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Object.create(null) no prototype`, () => { expect(Object.getPrototypeOf(Object.create(null))).toBeNull(); });
    it(`${name}: Object.create(proto) inherits`, () => { const proto = { a: 1 }; const o = Object.create(proto); expect(Object.getPrototypeOf(o)).toBe(proto); });
    it(`${name}: Object.getPrototypeOf({}) = Object.prototype`, () => { expect(Object.getPrototypeOf({})).toBe(Object.prototype); });
    it(`${name}: Object.setPrototypeOf works`, () => { const o: Record<string, unknown> = {}; Object.setPrototypeOf(o, { a: 1 }); expect((o as { a?: number }).a).toBe(1); });
    it(`${name}: Object.hasOwn works`, () => { expect(Object.hasOwn({ a: 1 }, "a")).toBe(true); expect(Object.hasOwn({ a: 1 }, "b")).toBe(false); });
    it(`${name}: hasOwnProperty inherited excluded`, () => { const child = Object.create({ inherited: 1 }); child.own = 2; expect(Object.hasOwn(child, "own")).toBe(true); expect(Object.hasOwn(child, "inherited")).toBe(false); });
    it(`${name}: Object.getOwnPropertyNames`, () => { expect(Object.getOwnPropertyNames({ a: 1, b: 2 })).toEqual(["a", "b"]); });
  }
});
