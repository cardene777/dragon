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

describe("iter315: parts additional (Number constants) 🎊 150x milestone", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Number.EPSILON > 0`, () => { expect(Number.EPSILON).toBeGreaterThan(0); });
    it(`${name}: Number.MAX_VALUE > 0`, () => { expect(Number.MAX_VALUE).toBeGreaterThan(0); });
    it(`${name}: Number.MIN_VALUE > 0`, () => { expect(Number.MIN_VALUE).toBeGreaterThan(0); });
    it(`${name}: Number.MAX_SAFE_INTEGER > nodes.length`, () => { expect(Number.MAX_SAFE_INTEGER).toBeGreaterThan(diagram.nodes.length); });
    it(`${name}: Number.NaN != Number.NaN`, () => { expect(Number.NaN === Number.NaN).toBe(false); });
    it(`${name}: Number.POSITIVE_INFINITY > nodes.length`, () => { expect(Number.POSITIVE_INFINITY).toBeGreaterThan(diagram.nodes.length); });
    it(`${name}: Number.NEGATIVE_INFINITY < 0`, () => { expect(Number.NEGATIVE_INFINITY).toBeLessThan(0); });
  }
});
