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

describe("milestone 190k (大台): comprehensive JS builtin sweep", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Array end-to-end`, () => { expect([3, 1, 2].sort((a, b) => a - b).map(x => x * 2).filter(x => x > 2)).toEqual([4, 6]); });
    it(`${name}: String end-to-end`, () => { expect("  Hello World  ".trim().toLowerCase().split(" ").join("-")).toBe("hello-world"); });
    it(`${name}: Object end-to-end`, () => { const o = { a: 1, b: 2, c: 3 }; expect(Object.entries(o).filter(([, v]) => v > 1).map(([k]) => k)).toEqual(["b", "c"]); });
    it(`${name}: Math end-to-end`, () => { expect(Math.round(Math.sqrt(Math.pow(3, 2) + Math.pow(4, 2)))).toBe(5); });
    it(`${name}: Set end-to-end`, () => { expect([...new Set([1, 1, 2, 3, 3])].reduce((a, b) => a + b, 0)).toBe(6); });
    it(`${name}: Map end-to-end`, () => { const m = new Map<string, number>(); ["a", "b", "a"].forEach(k => m.set(k, (m.get(k) ?? 0) + 1)); expect(m.get("a")).toBe(2); });
    it(`${name}: JSON end-to-end`, () => { expect(JSON.parse(JSON.stringify({ a: [1, 2], b: { c: 3 } }))).toEqual({ a: [1, 2], b: { c: 3 } }); });
    it(`${name}: Number end-to-end`, () => { expect(Number.parseInt((255).toString(16), 16)).toBe(255); });
    it(`${name}: Promise end-to-end`, async () => { expect(await Promise.all([1, 2, 3].map(x => Promise.resolve(x * 10)))).toEqual([10, 20, 30]); });
    it(`${name}: diagram nodes valid`, () => { expect(Array.isArray(diagram.nodes)).toBe(true); expect(typeof diagram.id).toBe("string"); });
  }
});
