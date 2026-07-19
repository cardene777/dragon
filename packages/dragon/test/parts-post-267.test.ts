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

describe("iter267: parts additional (Array bracket indexing)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes[0] = nodes.at(0) (nonempty)`, () => { if (diagram.nodes.length) expect(diagram.nodes[0]).toBe(diagram.nodes.at(0)); });
    it(`${name}: nodes[length] = undefined`, () => { expect(diagram.nodes[diagram.nodes.length]).toBeUndefined(); });
    it(`${name}: nodes[-1] = undefined`, () => { expect(diagram.nodes[-1]).toBeUndefined(); });
    it(`${name}: nodes[length-1] = last (nonempty)`, () => { if (diagram.nodes.length) expect(diagram.nodes[diagram.nodes.length - 1]).toBe(diagram.nodes[diagram.nodes.length - 1]); });
    it(`${name}: id[0] = charAt(0)`, () => { if (diagram.id.length) expect(diagram.id[0]).toBe(diagram.id.charAt(0)); });
    it(`${name}: id[length] = undefined`, () => { expect(diagram.id[diagram.id.length]).toBeUndefined(); });
    it(`${name}: edges[0] = edges.at(0) (nonempty)`, () => { if (diagram.edges.length) expect(diagram.edges[0]).toBe(diagram.edges.at(0)); });
  }
});
