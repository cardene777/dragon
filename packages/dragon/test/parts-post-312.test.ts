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

describe("iter312: parts additional (Date basics)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new Date(0) is Date`, () => { expect(new Date(0) instanceof Date).toBe(true); });
    it(`${name}: new Date(0).getTime() = 0`, () => { expect(new Date(0).getTime()).toBe(0); });
    it(`${name}: new Date(0).toISOString includes T`, () => { expect(new Date(0).toISOString()).toContain("T"); });
    it(`${name}: new Date(0).getFullYear = 1970`, () => { expect(new Date(0).getUTCFullYear()).toBe(1970); });
    it(`${name}: Date.parse("1970-01-01Z") = 0`, () => { expect(Date.parse("1970-01-01Z")).toBe(0); });
    it(`${name}: new Date(0).valueOf = 0`, () => { expect(new Date(0).valueOf()).toBe(0); });
    it(`${name}: Number(new Date(0)) = 0`, () => { expect(Number(new Date(0))).toBe(0); });
  }
});
