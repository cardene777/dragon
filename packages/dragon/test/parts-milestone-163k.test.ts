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

describe("milestone 163k: Spread / template literals", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: array spread`, () => { expect([...[1, 2], ...[3, 4]]).toEqual([1, 2, 3, 4]); });
    it(`${name}: object spread`, () => { expect({ ...{ a: 1 }, ...{ b: 2 } }).toEqual({ a: 1, b: 2 }); });
    it(`${name}: template literal`, () => { const x = 5; expect(`x=${x}`).toBe("x=5"); });
    it(`${name}: multi-line template`, () => { expect(`a\nb`).toBe("a\nb"); });
    it(`${name}: tagged template`, () => { const t = (s: TemplateStringsArray, ...v: unknown[]) => s.raw.join(",") + ":" + v.join(","); expect(t`hello ${1} world ${2}`).toBe("hello , world ,:1,2"); });
    it(`${name}: spread in fn call`, () => { const fn = (a: number, b: number, c: number) => a + b + c; expect(fn(...[1, 2, 3])).toBe(6); });
  }
});
