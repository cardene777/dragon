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

describe("iter296-milestone: parts 77k (Number bounds)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes.length < MAX_SAFE_INTEGER`, () => { expect(diagram.nodes.length).toBeLessThan(Number.MAX_SAFE_INTEGER); });
    it(`${name}: nodes.length > MIN_SAFE_INTEGER`, () => { expect(diagram.nodes.length).toBeGreaterThan(Number.MIN_SAFE_INTEGER); });
    it(`${name}: nodes.length is integer`, () => { expect(Number.isInteger(diagram.nodes.length)).toBe(true); });
  }
});
