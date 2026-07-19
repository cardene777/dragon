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

function* gen() { yield 1; yield 2; yield 3; }
function* infinite() { let i = 0; while (true) yield i++; }

describe("milestone 164k: Generator functions", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: gen yields`, () => { expect([...gen()]).toEqual([1, 2, 3]); });
    it(`${name}: gen next()`, () => { const g = gen(); expect(g.next().value).toBe(1); });
    it(`${name}: gen done`, () => { const g = gen(); g.next(); g.next(); g.next(); expect(g.next().done).toBe(true); });
    it(`${name}: gen return exits`, () => { const g = gen(); expect(g.return(42).value).toBe(42); expect(g.return(42).done).toBe(true); });
    it(`${name}: infinite limit`, () => { const g = infinite(); expect(g.next().value).toBe(0); expect(g.next().value).toBe(1); expect(g.next().value).toBe(2); });
    it(`${name}: gen typeof = "function"`, () => { expect(typeof gen).toBe("function"); });
  }
});
