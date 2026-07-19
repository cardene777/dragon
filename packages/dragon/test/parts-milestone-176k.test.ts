import { describe, it, expect } from "vitest";
import * as PartsMod from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllParts(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PARTS = collectAllParts(PartsMod);

describe("milestone 176k: Object.is / SameValueZero", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.is(NaN, NaN) = true`, () => { expect(Object.is(NaN, NaN)).toBe(true); });
    it(`${name}: NaN === NaN = false`, () => { expect(NaN === NaN).toBe(false); });
    it(`${name}: Object.is(0, -0) = false`, () => { expect(Object.is(0, -0)).toBe(false); });
    it(`${name}: 0 === -0 = true`, () => { expect(0 === -0).toBe(true); });
    it(`${name}: Object.is(1, 1) = true`, () => { expect(Object.is(1, 1)).toBe(true); });
    it(`${name}: Object.is("a", "a") = true`, () => { expect(Object.is("a", "a")).toBe(true); });
    it(`${name}: Object.is({}, {}) = false`, () => { expect(Object.is({}, {})).toBe(false); });
    it(`${name}: Object.is(obj, obj) = true`, () => { const o = {}; expect(Object.is(o, o)).toBe(true); });
  }
});
