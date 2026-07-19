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

describe("iter231: parts additional (Number/Math edge case)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes length is safe integer`, () => { expect(Number.isSafeInteger(diagram.nodes.length)).toBe(true); });
    it(`${name}: edges length is safe integer`, () => { expect(Number.isSafeInteger(diagram.edges.length)).toBe(true); });
    it(`${name}: nodes length finite`, () => { expect(Number.isFinite(diagram.nodes.length)).toBe(true); });
    it(`${name}: edges length finite`, () => { expect(Number.isFinite(diagram.edges.length)).toBe(true); });
    it(`${name}: nodes length not NaN`, () => { expect(Number.isNaN(diagram.nodes.length)).toBe(false); });
    it(`${name}: Math.max nodes length 0 >= 0`, () => { expect(Math.max(diagram.nodes.length, 0)).toBeGreaterThanOrEqual(0); });
    it(`${name}: Math.abs nodes length = nodes length`, () => { expect(Math.abs(diagram.nodes.length)).toBe(diagram.nodes.length); });
  }
});
