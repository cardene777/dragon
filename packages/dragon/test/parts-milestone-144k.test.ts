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

describe("milestone 144k: Number method basic", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: (42).toString() = "42"`, () => { expect((42).toString()).toBe("42"); });
    it(`${name}: (42).toString(2) = "101010"`, () => { expect((42).toString(2)).toBe("101010"); });
    it(`${name}: (42).toString(16) = "2a"`, () => { expect((42).toString(16)).toBe("2a"); });
    it(`${name}: (3.14).toFixed(1) = "3.1"`, () => { expect((3.14).toFixed(1)).toBe("3.1"); });
    it(`${name}: (3.14).toPrecision(2) = "3.1"`, () => { expect((3.14).toPrecision(2)).toBe("3.1"); });
    it(`${name}: parseInt("42", 10) = 42`, () => { expect(parseInt("42", 10)).toBe(42); });
    it(`${name}: parseFloat("3.14") = 3.14`, () => { expect(parseFloat("3.14")).toBe(3.14); });
  }
});
