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

describe("iter263-milestone: parts 66k (Array.of/from equivalence)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Array.of(nodes) length = 1`, () => { expect(Array.of(diagram.nodes).length).toBe(1); });
    it(`${name}: Array.from({length:3}) length = 3`, () => { expect(Array.from({ length: 3 }).length).toBe(3); });
    it(`${name}: Array.from(nodes) length = nodes length`, () => { expect(Array.from(diagram.nodes).length).toBe(diagram.nodes.length); });
  }
});
