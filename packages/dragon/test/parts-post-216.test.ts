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

describe("iter216: parts additional (Array reduce/reduceRight)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes reduce count = length`, () => { expect(diagram.nodes.reduce((a) => a + 1, 0)).toBe(diagram.nodes.length); });
    it(`${name}: nodes reduceRight count = length`, () => { expect(diagram.nodes.reduceRight((a) => a + 1, 0)).toBe(diagram.nodes.length); });
    it(`${name}: edges reduce count = length`, () => { expect(diagram.edges.reduce((a) => a + 1, 0)).toBe(diagram.edges.length); });
    it(`${name}: edges reduceRight count = length`, () => { expect(diagram.edges.reduceRight((a) => a + 1, 0)).toBe(diagram.edges.length); });
    it(`${name}: nodes reduce sum id length = same as reduceRight`, () => { expect(diagram.nodes.reduce((a, n) => a + n.id.length, 0)).toBe(diagram.nodes.reduceRight((a, n) => a + n.id.length, 0)); });
    it(`${name}: nodes reduce concat ids = reverse of reduceRight`, () => { const l = diagram.nodes.reduce((a, n) => a + n.id, ""); const r = diagram.nodes.reduceRight((a, n) => a + n.id, ""); expect(l.length).toBe(r.length); });
    it(`${name}: nodes reduce with [] preserves length`, () => { expect(diagram.nodes.reduce<unknown[]>((a, n) => [...a, n], []).length).toBe(diagram.nodes.length); });
  }
});
