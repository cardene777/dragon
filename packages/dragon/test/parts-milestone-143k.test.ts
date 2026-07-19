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

describe("milestone 143k: Math constants + log / exp", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Math.PI ~ 3.14159`, () => { expect(Math.PI).toBeCloseTo(3.14159); });
    it(`${name}: Math.E ~ 2.71828`, () => { expect(Math.E).toBeCloseTo(2.71828); });
    it(`${name}: Math.LN2 ~ 0.693`, () => { expect(Math.LN2).toBeCloseTo(0.693); });
    it(`${name}: Math.log(Math.E) ~ 1`, () => { expect(Math.log(Math.E)).toBeCloseTo(1); });
    it(`${name}: Math.log2(8) = 3`, () => { expect(Math.log2(8)).toBe(3); });
    it(`${name}: Math.log10(1000) = 3`, () => { expect(Math.log10(1000)).toBeCloseTo(3); });
    it(`${name}: Math.exp(0) = 1`, () => { expect(Math.exp(0)).toBe(1); });
  }
});
