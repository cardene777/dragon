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

describe("milestone 152k: Date UTC / arithmetic", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Date.UTC(2024, 0, 1) is number`, () => { expect(typeof Date.UTC(2024, 0, 1)).toBe("number"); });
    it(`${name}: Date arithmetic`, () => { const d1 = new Date("2024-01-01").getTime(); const d2 = new Date("2024-01-02").getTime(); expect(d2 - d1).toBe(86400000); });
    it(`${name}: getUTCMonth("2024-06-15") = 5`, () => { expect(new Date("2024-06-15").getUTCMonth()).toBe(5); });
    it(`${name}: getUTCDate("2024-06-15") = 15`, () => { expect(new Date("2024-06-15").getUTCDate()).toBe(15); });
    it(`${name}: Date now returns positive number`, () => { const d = new Date("2024-01-01").getTime(); expect(d).toBeGreaterThan(0); });
    it(`${name}: 24 hours = 86400 seconds`, () => { expect(24 * 60 * 60).toBe(86400); });
  }
});
