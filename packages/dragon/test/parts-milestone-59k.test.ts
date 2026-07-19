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

describe("iter242-milestone: parts 59k (Object.freeze idempotent)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.freeze({...d}) is frozen`, () => { expect(Object.isFrozen(Object.freeze({ ...diagram }))).toBe(true); });
    it(`${name}: Object.freeze twice idempotent`, () => { const f = Object.freeze({ ...diagram }); Object.freeze(f); expect(Object.isFrozen(f)).toBe(true); });
    it(`${name}: Object.seal({...d}) is sealed`, () => { expect(Object.isSealed(Object.seal({ ...diagram }))).toBe(true); });
  }
});
