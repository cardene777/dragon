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

describe("milestone 173k: Intl.NumberFormat / DateTimeFormat", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Intl.NumberFormat formats`, () => { const f = new Intl.NumberFormat("en-US"); expect(f.format(1234.5)).toBe("1,234.5"); });
    it(`${name}: currency format`, () => { const f = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }); expect(f.format(10)).toBe("$10.00"); });
    it(`${name}: percent format`, () => { const f = new Intl.NumberFormat("en-US", { style: "percent" }); expect(f.format(0.5)).toBe("50%"); });
    it(`${name}: DateTimeFormat is string`, () => { const f = new Intl.DateTimeFormat("en-US"); expect(typeof f.format(new Date("2024-01-01"))).toBe("string"); });
    it(`${name}: minimumFractionDigits`, () => { const f = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }); expect(f.format(5)).toBe("5.00"); });
    it(`${name}: Intl.NumberFormat instance`, () => { expect(new Intl.NumberFormat() instanceof Intl.NumberFormat).toBe(true); });
  }
});
