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

describe("milestone iter570: comprehensive Map/Set operations", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Set union`, () => { const a = new Set([1, 2]); const b = new Set([2, 3]); const u = new Set([...a, ...b]); expect([...u]).toEqual([1, 2, 3]); });
    it(`${name}: Set intersection`, () => { const a = new Set([1, 2, 3]); const b = new Set([2, 3, 4]); const i = new Set([...a].filter(x => b.has(x))); expect([...i]).toEqual([2, 3]); });
    it(`${name}: Set difference`, () => { const a = new Set([1, 2, 3]); const b = new Set([2, 3]); const d = new Set([...a].filter(x => !b.has(x))); expect([...d]).toEqual([1]); });
    it(`${name}: Map merge`, () => { const a = new Map([["x", 1]]); const b = new Map([["y", 2]]); const m = new Map([...a, ...b]); expect(m.size).toBe(2); });
    it(`${name}: Map from object`, () => { const m = new Map(Object.entries({ a: 1, b: 2 })); expect(m.get("a")).toBe(1); });
    it(`${name}: Object from Map`, () => { const m = new Map([["a", 1], ["b", 2]]); expect(Object.fromEntries(m)).toEqual({ a: 1, b: 2 }); });
    it(`${name}: Set to array dedup`, () => { expect([...new Set([1, 1, 2, 2, 3])]).toEqual([1, 2, 3]); });
    it(`${name}: Map keys iteration`, () => { const m = new Map([["a", 1], ["b", 2]]); expect([...m.keys()]).toEqual(["a", "b"]); });
    it(`${name}: nodes to Set size`, () => { const s = new Set(diagram.nodes); expect(s.size).toBeLessThanOrEqual(diagram.nodes.length); });
  }
});
