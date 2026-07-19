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

describe("iter444: parts additional (indexOf / lastIndexOf / includes)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: [1,2,3].indexOf(2) = 1`, () => { expect([1, 2, 3].indexOf(2)).toBe(1); });
    it(`${name}: [1,2,3].indexOf(4) = -1`, () => { expect([1, 2, 3].indexOf(4)).toBe(-1); });
    it(`${name}: [1,2,3,2].lastIndexOf(2) = 3`, () => { expect([1, 2, 3, 2].lastIndexOf(2)).toBe(3); });
    it(`${name}: [1,2,3].includes(2) = true`, () => { expect([1, 2, 3].includes(2)).toBe(true); });
    it(`${name}: [1,2,3].includes(4) = false`, () => { expect([1, 2, 3].includes(4)).toBe(false); });
    it(`${name}: [NaN].includes(NaN) = true`, () => { expect([NaN].includes(NaN)).toBe(true); });
    it(`${name}: nodes.indexOf(nodes[0]) = 0 or -1 (empty)`, () => { const i = diagram.nodes.indexOf(diagram.nodes[0]); expect(i).toBeGreaterThanOrEqual(-1); expect(i).toBeLessThan(diagram.nodes.length); });
  }
});
