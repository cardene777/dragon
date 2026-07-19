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

describe("iter249: parts additional (Array slice negative/boundary)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes.slice(0) = nodes`, () => { expect(diagram.nodes.slice(0)).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice() = nodes`, () => { expect(diagram.nodes.slice()).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice(0, 0) = []`, () => { expect(diagram.nodes.slice(0, 0)).toEqual([]); });
    it(`${name}: nodes.slice(-0) = nodes`, () => { expect(diagram.nodes.slice(-0)).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice(length) = []`, () => { expect(diagram.nodes.slice(diagram.nodes.length)).toEqual([]); });
    it(`${name}: nodes.slice(-length) = nodes`, () => { expect(diagram.nodes.slice(-diagram.nodes.length)).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice not = nodes ref`, () => { expect(diagram.nodes.slice()).not.toBe(diagram.nodes); });
  }
});
