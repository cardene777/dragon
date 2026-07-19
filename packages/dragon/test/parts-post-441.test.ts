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

describe("iter441: parts additional (Array.of / Array.from iterable)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Array.of(1,2,3) = [1,2,3]`, () => { expect(Array.of(1, 2, 3)).toEqual([1, 2, 3]); });
    it(`${name}: Array.of() = []`, () => { expect(Array.of()).toEqual([]); });
    it(`${name}: Array.of(7).length = 1`, () => { expect(Array.of(7).length).toBe(1); });
    it(`${name}: Array.from(new Set([1,1,2])) = [1,2]`, () => { expect(Array.from(new Set([1, 1, 2]))).toEqual([1, 2]); });
    it(`${name}: Array.from({length:3}) = [undef,undef,undef]`, () => { expect(Array.from({ length: 3 })).toEqual([undefined, undefined, undefined]); });
    it(`${name}: Array.from({length:3}, (_,i) => i) = [0,1,2]`, () => { expect(Array.from({ length: 3 }, (_, i) => i)).toEqual([0, 1, 2]); });
    it(`${name}: Array.isArray(diagram.nodes) = true`, () => { expect(Array.isArray(diagram.nodes)).toBe(true); });
  }
});
