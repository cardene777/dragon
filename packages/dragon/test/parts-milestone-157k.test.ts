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

describe("milestone 157k: Symbol basic", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: typeof Symbol() = "symbol"`, () => { expect(typeof Symbol()).toBe("symbol"); });
    it(`${name}: Symbol("x").description = "x"`, () => { expect(Symbol("x").description).toBe("x"); });
    it(`${name}: Symbol() != Symbol()`, () => { expect(Symbol()).not.toBe(Symbol()); });
    it(`${name}: Symbol.for("k") === Symbol.for("k")`, () => { expect(Symbol.for("k")).toBe(Symbol.for("k")); });
    it(`${name}: Symbol.keyFor(Symbol.for("k")) = "k"`, () => { expect(Symbol.keyFor(Symbol.for("k"))).toBe("k"); });
    it(`${name}: obj[Symbol()] not iterated by keys`, () => { const s = Symbol(); const o: Record<string | symbol, unknown> = { a: 1 }; o[s] = 2; expect(Object.keys(o)).toEqual(["a"]); });
  }
});
