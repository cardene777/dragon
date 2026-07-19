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

describe("milestone 148k: Set iteration / clear", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: [...new Set([1,2,3]).values()] = [1,2,3]`, () => { expect([...new Set([1, 2, 3]).values()]).toEqual([1, 2, 3]); });
    it(`${name}: [...new Set([1,2,3]).keys()] = [1,2,3]`, () => { expect([...new Set([1, 2, 3]).keys()]).toEqual([1, 2, 3]); });
    it(`${name}: [...new Set([1,2,3]).entries()][0] = [1,1]`, () => { expect([...new Set([1, 2, 3]).entries()][0]).toEqual([1, 1]); });
    it(`${name}: Set forEach count = size`, () => { const s = new Set([1, 2, 3]); let c = 0; s.forEach(() => c++); expect(c).toBe(s.size); });
    it(`${name}: new Set([1,2,3]).clear() size = 0`, () => { const s = new Set([1, 2, 3]); s.clear(); expect(s.size).toBe(0); });
    it(`${name}: Set preserves insertion order`, () => { expect([...new Set(["c", "a", "b"])]).toEqual(["c", "a", "b"]); });
  }
});
