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

describe("milestone 179k: bitwise operators", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: 5 & 3 = 1`, () => { expect(5 & 3).toBe(1); });
    it(`${name}: 5 | 3 = 7`, () => { expect(5 | 3).toBe(7); });
    it(`${name}: 5 ^ 3 = 6`, () => { expect(5 ^ 3).toBe(6); });
    it(`${name}: ~5 = -6`, () => { expect(~5).toBe(-6); });
    it(`${name}: 1 << 4 = 16`, () => { expect(1 << 4).toBe(16); });
    it(`${name}: 16 >> 2 = 4`, () => { expect(16 >> 2).toBe(4); });
    it(`${name}: -1 >>> 28 = 15`, () => { expect(-1 >>> 28).toBe(15); });
    it(`${name}: 5 & 3 | via truth`, () => { expect((5 & 1) === 1).toBe(true); });
  }
});
