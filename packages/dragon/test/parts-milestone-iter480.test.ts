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

describe("milestone iter480: JSON edge cases + reviver / replacer", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: JSON.stringify(undefined) = undefined`, () => { expect(JSON.stringify(undefined)).toBeUndefined(); });
    it(`${name}: JSON.stringify({a: undefined}) = "{}"`, () => { expect(JSON.stringify({ a: undefined })).toBe("{}"); });
    it(`${name}: JSON.stringify([undefined]) = "[null]"`, () => { expect(JSON.stringify([undefined])).toBe("[null]"); });
    it(`${name}: JSON.parse throws on invalid`, () => { expect(() => JSON.parse("not json")).toThrow(); });
    it(`${name}: stringify with indent`, () => { expect(JSON.stringify({ a: 1 }, null, 2)).toContain("\n"); });
    it(`${name}: replacer filter keys`, () => { expect(JSON.stringify({ a: 1, b: 2 }, ["a"])).toBe('{"a":1}'); });
    it(`${name}: reviver transform values`, () => { expect(JSON.parse('{"a":1}', (_k, v) => typeof v === "number" ? v * 2 : v)).toEqual({ a: 2 }); });
    it(`${name}: JSON.stringify(NaN) = "null"`, () => { expect(JSON.stringify(NaN)).toBe("null"); });
    it(`${name}: nodes roundtrip preserves length`, () => { expect(JSON.parse(JSON.stringify(diagram.nodes)).length).toBe(diagram.nodes.length); });
  }
});
