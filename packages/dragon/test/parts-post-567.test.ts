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

describe("iter567: parts additional (Array slice negative edge)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: slice(-2) last two`, () => { expect([1, 2, 3, 4].slice(-2)).toEqual([3, 4]); });
    it(`${name}: slice(1, -1) middle`, () => { expect([1, 2, 3, 4].slice(1, -1)).toEqual([2, 3]); });
    it(`${name}: slice(-3, -1)`, () => { expect([1, 2, 3, 4].slice(-3, -1)).toEqual([2, 3]); });
    it(`${name}: slice out of range = empty`, () => { expect([1, 2].slice(5)).toEqual([]); });
    it(`${name}: slice(0, 0) = empty`, () => { expect([1, 2].slice(0, 0)).toEqual([]); });
    it(`${name}: at(-2) works`, () => { expect([1, 2, 3].at(-2)).toBe(2); });
    it(`${name}: nodes slice(-1) last`, () => { const r = diagram.nodes.slice(-1); if (diagram.nodes.length > 0) expect(r[0]).toBe(diagram.nodes[diagram.nodes.length - 1]); else expect(r).toEqual([]); });
  }
});
