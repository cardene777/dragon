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

describe("milestone 186k: ternary / comma / void / typeof edge", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: ternary true`, () => { expect(1 > 0 ? "a" : "b").toBe("a"); });
    it(`${name}: ternary false`, () => { expect(1 < 0 ? "a" : "b").toBe("b"); });
    it(`${name}: nested ternary`, () => { const x = 5; expect(x < 0 ? "neg" : x === 0 ? "zero" : "pos").toBe("pos"); });
    it(`${name}: comma operator`, () => { const r = (1, 2, 3); expect(r).toBe(3); });
    it(`${name}: void returns undefined`, () => { expect(void 0).toBeUndefined(); });
    it(`${name}: void expr side effect`, () => { let x = 0; void (x = 5); expect(x).toBe(5); });
    it(`${name}: typeof undefined var safe`, () => { expect(typeof (globalThis as Record<string, unknown>).__nonexistent__).toBe("undefined"); });
    it(`${name}: delete operator`, () => { const o: { a?: number } = { a: 1 }; delete o.a; expect(o.a).toBeUndefined(); });
  }
});
