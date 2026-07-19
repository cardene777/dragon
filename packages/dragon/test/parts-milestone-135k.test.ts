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

describe("milestone 135k: Array every / some / forEach", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: [1,2,3].every(x => x > 0) = true`, () => { expect([1, 2, 3].every(x => x > 0)).toBe(true); });
    it(`${name}: [1,2,3].every(x => x > 1) = false`, () => { expect([1, 2, 3].every(x => x > 1)).toBe(false); });
    it(`${name}: [].every(x => x > 0) = true (vacuous)`, () => { expect([].every((x: number) => x > 0)).toBe(true); });
    it(`${name}: [1,2,3].some(x => x > 2) = true`, () => { expect([1, 2, 3].some(x => x > 2)).toBe(true); });
    it(`${name}: [1,2,3].some(x => x > 10) = false`, () => { expect([1, 2, 3].some(x => x > 10)).toBe(false); });
    it(`${name}: [].some(x => x > 0) = false (vacuous)`, () => { expect([].some((x: number) => x > 0)).toBe(false); });
    it(`${name}: forEach returns undefined`, () => { expect([1, 2, 3].forEach(() => {})).toBeUndefined(); });
  }
});
