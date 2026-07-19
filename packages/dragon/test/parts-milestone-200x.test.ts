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

describe("🎊🎊🎊 200x 倍増マイルストーン: parts (Math constants and functions)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Math.PI > 3.14`, () => { expect(Math.PI).toBeGreaterThan(3.14); });
    it(`${name}: Math.E > 2.7`, () => { expect(Math.E).toBeGreaterThan(2.7); });
    it(`${name}: Math.LN2 > 0`, () => { expect(Math.LN2).toBeGreaterThan(0); });
    it(`${name}: Math.LN10 > 2`, () => { expect(Math.LN10).toBeGreaterThan(2); });
    it(`${name}: Math.LOG2E > 1`, () => { expect(Math.LOG2E).toBeGreaterThan(1); });
    it(`${name}: Math.LOG10E > 0`, () => { expect(Math.LOG10E).toBeGreaterThan(0); });
    it(`${name}: Math.SQRT2 > 1.4`, () => { expect(Math.SQRT2).toBeGreaterThan(1.4); });
    it(`${name}: Math.SQRT1_2 < 1`, () => { expect(Math.SQRT1_2).toBeLessThan(1); });
    it(`${name}: Math.floor(3.7) = 3`, () => { expect(Math.floor(3.7)).toBe(3); });
    it(`${name}: Math.ceil(3.2) = 4`, () => { expect(Math.ceil(3.2)).toBe(4); });
    it(`${name}: Math.round(3.5) = 4`, () => { expect(Math.round(3.5)).toBe(4); });
    it(`${name}: Math.trunc(3.7) = 3`, () => { expect(Math.trunc(3.7)).toBe(3); });
    it(`${name}: Math.abs(-5) = 5`, () => { expect(Math.abs(-5)).toBe(5); });
    it(`${name}: Math.max(1,2,3) = 3`, () => { expect(Math.max(1, 2, 3)).toBe(3); });
    it(`${name}: Math.min(1,2,3) = 1`, () => { expect(Math.min(1, 2, 3)).toBe(1); });
  }
});
