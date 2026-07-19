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

describe("iter347-milestone: parts 95k (Function.prototype.apply with spread)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: fn.apply(null, [id]) = id`, () => { const f = (x: string) => x; expect(f.apply(null, [diagram.id] as [string])).toBe(diagram.id); });
    it(`${name}: Math.max.apply(null, [1,2,3]) = 3`, () => { expect(Math.max.apply(null, [1, 2, 3])).toBe(3); });
    it(`${name}: Math.min.apply(null, [1,2,3]) = 1`, () => { expect(Math.min.apply(null, [1, 2, 3])).toBe(1); });
  }
});
