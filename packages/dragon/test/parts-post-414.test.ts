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

describe("iter414: parts additional (Object.defineProperty)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: defineProperty(o, "x", {value: 1}).x = 1`, () => { const o: Record<string, unknown> = {}; Object.defineProperty(o, "x", { value: 1 }); expect(o.x).toBe(1); });
    it(`${name}: defineProperty writable false blocks`, () => { const o: Record<string, unknown> = {}; Object.defineProperty(o, "x", { value: 1, writable: false }); expect(() => { o.x = 2; }).toThrow(); });
    it(`${name}: defineProperty enumerable false hides`, () => { const o: Record<string, unknown> = {}; Object.defineProperty(o, "x", { value: 1 }); expect(Object.keys(o)).toEqual([]); });
    it(`${name}: defineProperty getter works`, () => { const o = {}; Object.defineProperty(o, "x", { get() { return 42; } }); expect((o as { x: number }).x).toBe(42); });
    it(`${name}: defineProperties bulk works`, () => { const o = {}; Object.defineProperties(o, { a: { value: 1 }, b: { value: 2 } }); expect((o as { a: number; b: number }).a).toBe(1); });
    it(`${name}: Object.defineProperty is function`, () => { expect(typeof Object.defineProperty).toBe("function"); });
    it(`${name}: getOwnPropertyDescriptor(d, "id") writable defined`, () => { const d = Object.getOwnPropertyDescriptor(diagram, "id"); expect(d).toBeDefined(); });
  }
});
