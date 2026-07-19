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

describe("🎊🎊 75k milestone: parts (Array.prototype.toSpliced/toReversed/toSorted)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes.toReversed().toReversed() = nodes`, () => { expect(diagram.nodes.toReversed().toReversed()).toEqual(diagram.nodes); });
    it(`${name}: nodes.toSorted length = nodes length`, () => { expect(diagram.nodes.toSorted((a, b) => a.id.localeCompare(b.id)).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes.toSpliced(0) = []`, () => { expect(diagram.nodes.toSpliced(0)).toEqual([]); });
  }
});
