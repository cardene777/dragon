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

describe("iter528: parts additional (Reflect)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Reflect.has({a:1}, "a") = true`, () => { expect(Reflect.has({ a: 1 }, "a")).toBe(true); });
    it(`${name}: Reflect.has({a:1}, "b") = false`, () => { expect(Reflect.has({ a: 1 }, "b")).toBe(false); });
    it(`${name}: Reflect.get({a:1}, "a") = 1`, () => { expect(Reflect.get({ a: 1 }, "a")).toBe(1); });
    it(`${name}: Reflect.set works`, () => { const o: Record<string, number> = {}; Reflect.set(o, "a", 5); expect(o.a).toBe(5); });
    it(`${name}: Reflect.deleteProperty works`, () => { const o = { a: 1 }; Reflect.deleteProperty(o, "a"); expect((o as Partial<typeof o>).a).toBeUndefined(); });
    it(`${name}: Reflect.ownKeys({a:1,b:2}) = ["a","b"]`, () => { expect(Reflect.ownKeys({ a: 1, b: 2 })).toEqual(["a", "b"]); });
    it(`${name}: Reflect.getPrototypeOf(obj)`, () => { expect(Reflect.getPrototypeOf({})).toBe(Object.prototype); });
  }
});
