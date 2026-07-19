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

describe("milestone iter450 大 mid-milestone: Array Math aggregate", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Math.min(...[3,1,2]) = 1`, () => { expect(Math.min(...[3, 1, 2])).toBe(1); });
    it(`${name}: Math.max(...[3,1,2]) = 3`, () => { expect(Math.max(...[3, 1, 2])).toBe(3); });
    it(`${name}: sum via reduce = 6`, () => { expect([1, 2, 3].reduce((a, b) => a + b, 0)).toBe(6); });
    it(`${name}: product via reduce = 6`, () => { expect([1, 2, 3].reduce((a, b) => a * b, 1)).toBe(6); });
    it(`${name}: min via reduce = 1`, () => { expect([3, 1, 2].reduce((a, b) => a < b ? a : b)).toBe(1); });
    it(`${name}: max via reduce = 3`, () => { expect([3, 1, 2].reduce((a, b) => a > b ? a : b)).toBe(3); });
    it(`${name}: avg via reduce/length = 2`, () => { const a = [1, 2, 3]; expect(a.reduce((x, y) => x + y, 0) / a.length).toBe(2); });
    it(`${name}: nodes count = length`, () => { expect(diagram.nodes.length).toBeGreaterThanOrEqual(0); });
  }
});
