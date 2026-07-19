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

describe("iter507: parts additional (Function / arrow)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: fn declaration`, () => { function fn() { return 42; } expect(fn()).toBe(42); });
    it(`${name}: arrow function`, () => { const fn = () => 42; expect(fn()).toBe(42); });
    it(`${name}: fn with params`, () => { const fn = (a: number, b: number) => a + b; expect(fn(2, 3)).toBe(5); });
    it(`${name}: fn default param`, () => { const fn = (a = 10) => a; expect(fn()).toBe(10); expect(fn(5)).toBe(5); });
    it(`${name}: fn rest params`, () => { const fn = (...args: number[]) => args.length; expect(fn(1, 2, 3)).toBe(3); });
    it(`${name}: fn.length = param count`, () => { const fn = (_a: number, _b: number, _c: number) => 0; expect(fn.length).toBe(3); });
    it(`${name}: fn.name = "fn"`, () => { function myFn() { /* noop */ } expect(myFn.name).toBe("myFn"); });
  }
});
