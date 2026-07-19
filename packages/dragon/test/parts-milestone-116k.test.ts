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

describe("iter404-milestone: parts 116k (structuredClone nested)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: structuredClone nested Array works`, () => { expect(structuredClone([[1, 2], [3, 4]])).toEqual([[1, 2], [3, 4]]); });
    it(`${name}: structuredClone Map works`, () => { const m = new Map([[1, "a"]]); expect(structuredClone(m).get(1)).toBe("a"); });
    it(`${name}: structuredClone Set works`, () => { const s = new Set([1, 2, 3]); expect(structuredClone(s).size).toBe(3); });
  }
});
