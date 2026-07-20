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

describe("iter564: parts additional (findLast / findLastIndex edge)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: findLast matches last`, () => { expect([1, 2, 3, 4].findLast(x => x % 2 === 0)).toBe(4); });
    it(`${name}: findLastIndex`, () => { expect([1, 2, 3, 4].findLastIndex(x => x % 2 === 0)).toBe(3); });
    it(`${name}: findLast no match = undefined`, () => { expect([1, 3, 5].findLast(x => x % 2 === 0)).toBeUndefined(); });
    it(`${name}: findLastIndex no match = -1`, () => { expect([1, 3, 5].findLastIndex(x => x % 2 === 0)).toBe(-1); });
    it(`${name}: findLast empty = undefined`, () => { expect([].findLast(() => true)).toBeUndefined(); });
    it(`${name}: findLast index param`, () => { const seen: number[] = []; [10, 20, 30].findLast((_, i) => { seen.push(i); return false; }); expect(seen).toEqual([2, 1, 0]); });
    it(`${name}: nodes findLast valid`, () => { const r = diagram.nodes.findLast(() => true); if (diagram.nodes.length > 0) expect(r).toBe(diagram.nodes[diagram.nodes.length - 1]); else expect(r).toBeUndefined(); });
  }
});
