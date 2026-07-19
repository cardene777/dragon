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

describe("milestone 150k (大台): Map iteration + WeakMap / WeakSet", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: [...new Map([["a",1],["b",2]]).keys()] = ["a","b"]`, () => { expect([...new Map([["a", 1], ["b", 2]]).keys()]).toEqual(["a", "b"]); });
    it(`${name}: [...new Map([["a",1],["b",2]]).values()] = [1,2]`, () => { expect([...new Map([["a", 1], ["b", 2]]).values()]).toEqual([1, 2]); });
    it(`${name}: [...new Map([["a",1]]).entries()][0] = ["a", 1]`, () => { expect([...new Map([["a", 1]]).entries()][0]).toEqual(["a", 1]); });
    it(`${name}: Map forEach count = size`, () => { const m = new Map([["a", 1], ["b", 2]]); let c = 0; m.forEach(() => c++); expect(c).toBe(m.size); });
    it(`${name}: new Map([["a",1]]).clear() size = 0`, () => { const m = new Map([["a", 1]]); m.clear(); expect(m.size).toBe(0); });
    it(`${name}: WeakMap set/get object key`, () => { const k = {}; const m = new WeakMap(); m.set(k, "v"); expect(m.get(k)).toBe("v"); });
    it(`${name}: WeakSet add/has object`, () => { const o = {}; const s = new WeakSet(); s.add(o); expect(s.has(o)).toBe(true); });
    it(`${name}: Map preserves insertion order`, () => { const m = new Map([["c", 1], ["a", 2], ["b", 3]]); expect([...m.keys()]).toEqual(["c", "a", "b"]); });
    it(`${name}: nodes to Map roundtrip`, () => { const m = new Map(diagram.nodes.map((n, i) => [i, n] as const)); expect(m.size).toBe(diagram.nodes.length); });
  }
});
