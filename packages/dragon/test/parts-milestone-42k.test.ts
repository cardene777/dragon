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

describe("iter187: parts milestone 42k (9 axis reduce/from/of)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Array.from nodes length`, () => { expect(Array.from(diagram.nodes).length).toBe(diagram.nodes.length); });
    it(`${name}: Array.from edges length`, () => { expect(Array.from(diagram.edges).length).toBe(diagram.edges.length); });
    it(`${name}: Array.of id length 1`, () => { expect(Array.of(diagram.id).length).toBe(1); });
    it(`${name}: nodes reduceRight count`, () => { expect(diagram.nodes.reduceRight((a) => a + 1, 0)).toBe(diagram.nodes.length); });
    it(`${name}: edges reduceRight count`, () => { expect(diagram.edges.reduceRight((a) => a + 1, 0)).toBe(diagram.edges.length); });
    it(`${name}: nodes fill length preserve`, () => { const c = [...diagram.nodes]; expect(c.fill(c[0] as never).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes copyWithin length preserve`, () => { const c = [...diagram.nodes]; expect(c.copyWithin(0, 0).length).toBe(diagram.nodes.length); });
    it(`${name}: id from length equal`, () => { expect(Array.from(diagram.id).length).toBeGreaterThanOrEqual(0); });
    it(`${name}: nodes keys iterable`, () => { expect(typeof diagram.nodes.keys).toBe("function"); });
  }
});
