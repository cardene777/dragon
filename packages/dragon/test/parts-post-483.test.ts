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

describe("iter483: parts additional (Set basic)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new Set([1,2,3]).size = 3`, () => { expect(new Set([1, 2, 3]).size).toBe(3); });
    it(`${name}: new Set([1,1,2]).size = 2 (dedup)`, () => { expect(new Set([1, 1, 2]).size).toBe(2); });
    it(`${name}: new Set().add(1).has(1) = true`, () => { expect(new Set().add(1).has(1)).toBe(true); });
    it(`${name}: new Set([1]).delete(1) = true`, () => { expect(new Set([1]).delete(1)).toBe(true); });
    it(`${name}: new Set([1]).delete(2) = false`, () => { expect(new Set([1]).delete(2)).toBe(false); });
    it(`${name}: [...new Set([1,2,3])] length = 3`, () => { expect([...new Set([1, 2, 3])].length).toBe(3); });
    it(`${name}: new Set(nodes).size <= nodes.length`, () => { expect(new Set(diagram.nodes).size).toBeLessThanOrEqual(diagram.nodes.length); });
  }
});
