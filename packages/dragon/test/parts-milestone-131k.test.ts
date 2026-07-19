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

describe("milestone 131k: Array find / findIndex / findLast", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: [1,2,3].find(x => x > 1) = 2`, () => { expect([1, 2, 3].find(x => x > 1)).toBe(2); });
    it(`${name}: [1,2,3].findIndex(x => x > 1) = 1`, () => { expect([1, 2, 3].findIndex(x => x > 1)).toBe(1); });
    it(`${name}: [1,2,3].findLast(x => x < 3) = 2`, () => { expect([1, 2, 3].findLast(x => x < 3)).toBe(2); });
    it(`${name}: [1,2,3].find(x => x > 10) = undefined`, () => { expect([1, 2, 3].find(x => x > 10)).toBeUndefined(); });
  }
});
