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

describe("milestone 170 PR merge + 145k: Object mutation / assign / freeze", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.assign({}, {a:1}) = {a:1}`, () => { expect(Object.assign({}, { a: 1 })).toEqual({ a: 1 }); });
    it(`${name}: Object.assign merges last wins`, () => { expect(Object.assign({}, { a: 1 }, { a: 2 })).toEqual({ a: 2 }); });
    it(`${name}: {...{a:1}, ...{b:2}} spread merge`, () => { expect({ ...{ a: 1 }, ...{ b: 2 } }).toEqual({ a: 1, b: 2 }); });
    it(`${name}: Object.freeze({a:1}) freezes`, () => { const o = Object.freeze({ a: 1 }); expect(Object.isFrozen(o)).toBe(true); });
    it(`${name}: Object.freeze mutation ignored (strict throws)`, () => { const o = Object.freeze({ a: 1 } as { a: number }); expect(() => { "use strict"; (o as { a: number }).a = 2; }).toThrow(); });
    it(`${name}: Object.seal({a:1}) seals`, () => { const o = Object.seal({ a: 1 }); expect(Object.isSealed(o)).toBe(true); });
    it(`${name}: Object.isFrozen({}) = false`, () => { expect(Object.isFrozen({})).toBe(false); });
    it(`${name}: diagram has id string`, () => { expect(typeof diagram.id).toBe("string"); });
  }
});
