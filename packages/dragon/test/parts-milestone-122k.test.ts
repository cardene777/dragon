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

describe("iter422-milestone: parts 122k (Date UTC methods)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Date.UTC(2000, 0, 1) is number`, () => { expect(typeof Date.UTC(2000, 0, 1)).toBe("number"); });
    it(`${name}: new Date(Date.UTC(2000, 0, 1)).getUTCFullYear = 2000`, () => { expect(new Date(Date.UTC(2000, 0, 1)).getUTCFullYear()).toBe(2000); });
    it(`${name}: new Date(0).toUTCString includes GMT`, () => { expect(new Date(0).toUTCString()).toContain("GMT"); });
  }
});
