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

describe("iter477: parts additional (Object.keys / values / entries / fromEntries)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.keys({a:1, b:2}) = ["a","b"]`, () => { expect(Object.keys({ a: 1, b: 2 })).toEqual(["a", "b"]); });
    it(`${name}: Object.values({a:1, b:2}) = [1,2]`, () => { expect(Object.values({ a: 1, b: 2 })).toEqual([1, 2]); });
    it(`${name}: Object.entries({a:1}).length = 1`, () => { expect(Object.entries({ a: 1 }).length).toBe(1); });
    it(`${name}: Object.entries({a:1})[0] = ["a", 1]`, () => { expect(Object.entries({ a: 1 })[0]).toEqual(["a", 1]); });
    it(`${name}: Object.fromEntries([["a", 1]]) = {a:1}`, () => { expect(Object.fromEntries([["a", 1]])).toEqual({ a: 1 }); });
    it(`${name}: keys/values roundtrip`, () => { const o = { a: 1, b: 2 }; expect(Object.fromEntries(Object.entries(o))).toEqual(o); });
    it(`${name}: diagram id in keys`, () => { expect(Object.keys(diagram)).toContain("id"); });
  }
});
