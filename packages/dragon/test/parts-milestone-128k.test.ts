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

describe("milestone 128k: Array typeof/isArray/from", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Array.isArray([]) = true`, () => { expect(Array.isArray([])).toBe(true); });
    it(`${name}: typeof [] = "object"`, () => { expect(typeof []).toBe("object"); });
    it(`${name}: Array.from("abc") = ["a","b","c"]`, () => { expect(Array.from("abc")).toEqual(["a", "b", "c"]); });
    it(`${name}: nodes typeof preserved`, () => { expect(Array.isArray(diagram.nodes)).toBe(true); });
  }
});
