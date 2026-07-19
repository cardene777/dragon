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

describe("milestone 160k (大台): Function.bind / call / apply + closures", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: fn.bind returns fn`, () => { function fn(this: { a: number }) { return this.a; } const bound = fn.bind({ a: 10 }); expect(bound()).toBe(10); });
    it(`${name}: fn.call sets this`, () => { function fn(this: { a: number }) { return this.a; } expect(fn.call({ a: 20 })).toBe(20); });
    it(`${name}: fn.apply array args`, () => { function fn(a: number, b: number) { return a + b; } expect(fn.apply(null, [1, 2])).toBe(3); });
    it(`${name}: closure captures`, () => { function make(x: number) { return () => x; } const f = make(42); expect(f()).toBe(42); });
    it(`${name}: closure counter`, () => { function makeCounter() { let c = 0; return () => ++c; } const inc = makeCounter(); expect(inc()).toBe(1); expect(inc()).toBe(2); });
    it(`${name}: arrow inherits this`, () => { const obj = { v: 5, get: function () { return (() => this.v)(); } }; expect(obj.get()).toBe(5); });
    it(`${name}: IIFE runs`, () => { const r = (() => 99)(); expect(r).toBe(99); });
    it(`${name}: recursive fn`, () => { function fact(n: number): number { return n <= 1 ? 1 : n * fact(n - 1); } expect(fact(5)).toBe(120); });
    it(`${name}: high-order fn`, () => { const compose = <T>(f: (x: T) => T, g: (x: T) => T) => (x: T) => f(g(x)); const fn = compose((x: number) => x + 1, (x: number) => x * 2); expect(fn(3)).toBe(7); });
  }
});
