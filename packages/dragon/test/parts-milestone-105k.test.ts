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

describe("iter374-milestone: parts 105k (Array immutable methods ES2023)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes.toReversed does not mutate`, () => { const before = diagram.nodes.slice(); diagram.nodes.toReversed(); expect(diagram.nodes).toEqual(before); });
    it(`${name}: nodes.toSorted does not mutate`, () => { const before = diagram.nodes.slice(); diagram.nodes.toSorted((a, b) => a.id.localeCompare(b.id)); expect(diagram.nodes).toEqual(before); });
    it(`${name}: nodes.toSpliced does not mutate`, () => { const before = diagram.nodes.slice(); diagram.nodes.toSpliced(0, 1); expect(diagram.nodes).toEqual(before); });
  }
});
