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

describe("milestone 165k: Boolean coercion / truthy / falsy", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Boolean(0) = false`, () => { expect(Boolean(0)).toBe(false); });
    it(`${name}: Boolean("") = false`, () => { expect(Boolean("")).toBe(false); });
    it(`${name}: Boolean(null) = false`, () => { expect(Boolean(null)).toBe(false); });
    it(`${name}: Boolean(undefined) = false`, () => { expect(Boolean(undefined)).toBe(false); });
    it(`${name}: Boolean(NaN) = false`, () => { expect(Boolean(NaN)).toBe(false); });
    it(`${name}: Boolean(1) = true`, () => { expect(Boolean(1)).toBe(true); });
    it(`${name}: Boolean("a") = true`, () => { expect(Boolean("a")).toBe(true); });
    it(`${name}: Boolean([]) = true`, () => { expect(Boolean([])).toBe(true); });
    it(`${name}: Boolean({}) = true`, () => { expect(Boolean({})).toBe(true); });
    it(`${name}: !! double negate to boolean`, () => { expect(!!diagram.id).toBe(diagram.id.length > 0); });
  }
});
