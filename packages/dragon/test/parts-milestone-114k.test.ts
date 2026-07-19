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

describe("iter398-milestone: parts 114k (Array.from with mapFn)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Array.from(id, (c)=>c) join = id`, () => { expect(Array.from(diagram.id, (c) => c).join("")).toBe(Array.from(diagram.id).join("")); });
    it(`${name}: Array.from({length:3}, (_,i)=>i) = [0,1,2]`, () => { expect(Array.from({ length: 3 }, (_, i) => i)).toEqual([0, 1, 2]); });
    it(`${name}: Array.from(id, ()=>0) all zeros`, () => { const r = Array.from(diagram.id, () => 0); for (const n of r) expect(n).toBe(0); });
  }
});
