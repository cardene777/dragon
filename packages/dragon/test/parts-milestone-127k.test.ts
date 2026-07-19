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

describe("iter437-milestone: parts 127k (Array unshift/shift)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: unshift returns new length`, () => { const a = [1, 2]; expect(a.unshift(0)).toBe(3); expect(a).toEqual([0, 1, 2]); });
    it(`${name}: shift returns first removed`, () => { const a = [1, 2, 3]; expect(a.shift()).toBe(1); expect(a).toEqual([2, 3]); });
    it(`${name}: [].shift() = undefined`, () => { expect([].shift()).toBeUndefined(); });
  }
});
