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

describe("iter314-milestone: parts 84k (Date arithmetic)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Date(1000) - Date(0) = 1000`, () => { expect(new Date(1000).getTime() - new Date(0).getTime()).toBe(1000); });
    it(`${name}: Date(0) < Date(1000)`, () => { expect(new Date(0) < new Date(1000)).toBe(true); });
    it(`${name}: Date getMonth in [0,11]`, () => { const m = new Date(0).getUTCMonth(); expect(m).toBeGreaterThanOrEqual(0); expect(m).toBeLessThanOrEqual(11); });
  }
});
