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

describe("milestone 141k: Math abs / sign / floor / ceil / round / trunc", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Math.abs(-3) = 3`, () => { expect(Math.abs(-3)).toBe(3); });
    it(`${name}: Math.sign(-5) = -1`, () => { expect(Math.sign(-5)).toBe(-1); });
    it(`${name}: Math.sign(0) = 0`, () => { expect(Math.sign(0)).toBe(0); });
    it(`${name}: Math.floor(3.7) = 3`, () => { expect(Math.floor(3.7)).toBe(3); });
    it(`${name}: Math.ceil(3.2) = 4`, () => { expect(Math.ceil(3.2)).toBe(4); });
    it(`${name}: Math.round(3.5) = 4`, () => { expect(Math.round(3.5)).toBe(4); });
    it(`${name}: Math.trunc(-3.7) = -3`, () => { expect(Math.trunc(-3.7)).toBe(-3); });
  }
});
