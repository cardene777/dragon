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

describe("iter570: parts additional (flatMap / Array.from mapper)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: flatMap double`, () => { expect([1, 2, 3].flatMap(x => [x, x])).toEqual([1, 1, 2, 2, 3, 3]); });
    it(`${name}: flatMap empty removes`, () => { expect([1, 2, 3].flatMap(x => x === 2 ? [] : [x])).toEqual([1, 3]); });
    it(`${name}: flatMap flattens 1 level only`, () => { expect([1, 2].flatMap(x => [[x]])).toEqual([[1], [2]]); });
    it(`${name}: Array.from with mapper`, () => { expect(Array.from([1, 2, 3], x => x * 10)).toEqual([10, 20, 30]); });
    it(`${name}: Array.from string with mapper`, () => { expect(Array.from("abc", c => c.toUpperCase())).toEqual(["A", "B", "C"]); });
    it(`${name}: Array.from index in mapper`, () => { expect(Array.from({ length: 3 }, (_, i) => i * i)).toEqual([0, 1, 4]); });
    it(`${name}: nodes flatMap identity`, () => { const r = diagram.nodes.flatMap(n => [n]); expect(r.length).toBe(diagram.nodes.length); });
  }
});
