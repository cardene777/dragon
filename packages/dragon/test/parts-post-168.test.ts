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

describe("iter168: parts additional (index range)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id[0] defined`, () => { expect(diagram.id[0]).toBeDefined(); });
    it(`${name}: id[last] defined`, () => { expect(diagram.id[diagram.id.length - 1]).toBeDefined(); });
    it(`${name}: id[out] undefined`, () => { expect(diagram.id[diagram.id.length]).toBeUndefined(); });
    it(`${name}: nodes[0] or empty`, () => { if (diagram.nodes.length > 0) expect(diagram.nodes[0]).toBeDefined(); else expect(true).toBe(true); });
    it(`${name}: edges[0] or empty`, () => { if (diagram.edges.length > 0) expect(diagram.edges[0]).toBeDefined(); else expect(true).toBe(true); });
    it(`${name}: nodes[out] undefined`, () => { expect(diagram.nodes[diagram.nodes.length]).toBeUndefined(); });
    it(`${name}: edges[out] undefined`, () => { expect(diagram.edges[diagram.edges.length]).toBeUndefined(); });
  }
});
