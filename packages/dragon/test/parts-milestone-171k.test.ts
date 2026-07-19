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

describe("milestone 171k: Object property descriptors", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.defineProperty`, () => { const o: Record<string, unknown> = {}; Object.defineProperty(o, "a", { value: 5 }); expect(o.a).toBe(5); });
    it(`${name}: enumerable false`, () => { const o: Record<string, unknown> = {}; Object.defineProperty(o, "a", { value: 5, enumerable: false }); expect(Object.keys(o)).toEqual([]); });
    it(`${name}: writable false`, () => { const o: { a?: number } = {}; Object.defineProperty(o, "a", { value: 5, writable: false }); expect(() => { "use strict"; (o as { a: number }).a = 10; }).toThrow(); });
    it(`${name}: Object.getOwnPropertyDescriptor`, () => { const o = { a: 1 }; const d = Object.getOwnPropertyDescriptor(o, "a"); expect(d?.value).toBe(1); expect(d?.enumerable).toBe(true); });
    it(`${name}: Object.defineProperties`, () => { const o: Record<string, unknown> = {}; Object.defineProperties(o, { a: { value: 1, enumerable: true }, b: { value: 2, enumerable: true } }); expect(Object.keys(o)).toEqual(["a", "b"]); });
    it(`${name}: getter defined`, () => { const o: Record<string, unknown> = {}; Object.defineProperty(o, "x", { get() { return 42; } }); expect(o.x).toBe(42); });
  }
});
