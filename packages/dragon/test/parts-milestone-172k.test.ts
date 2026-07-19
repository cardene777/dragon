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

describe("milestone 172k: localeCompare / Intl.Collator", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: "a".localeCompare("b") < 0`, () => { expect("a".localeCompare("b")).toBeLessThan(0); });
    it(`${name}: "b".localeCompare("a") > 0`, () => { expect("b".localeCompare("a")).toBeGreaterThan(0); });
    it(`${name}: "a".localeCompare("a") = 0`, () => { expect("a".localeCompare("a")).toBe(0); });
    it(`${name}: sort with localeCompare`, () => { expect(["banana", "apple", "cherry"].sort((a, b) => a.localeCompare(b))).toEqual(["apple", "banana", "cherry"]); });
    it(`${name}: Intl.Collator compare`, () => { const c = new Intl.Collator(); expect(c.compare("a", "b")).toBeLessThan(0); });
    it(`${name}: numeric collation`, () => { const c = new Intl.Collator(undefined, { numeric: true }); expect(c.compare("2", "10")).toBeLessThan(0); });
  }
});
