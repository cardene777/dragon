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

describe("iter222: parts additional (Array filter/map)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes filter truthy length = nodes length`, () => { expect(diagram.nodes.filter(() => true).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes filter falsy length = 0`, () => { expect(diagram.nodes.filter(() => false).length).toBe(0); });
    it(`${name}: edges filter truthy length = edges length`, () => { expect(diagram.edges.filter(() => true).length).toBe(diagram.edges.length); });
    it(`${name}: nodes map identity length = nodes length`, () => { expect(diagram.nodes.map(n => n).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes map identity content = nodes`, () => { expect(diagram.nodes.map(n => n)).toEqual(diagram.nodes); });
    it(`${name}: edges map identity length = edges length`, () => { expect(diagram.edges.map(e => e).length).toBe(diagram.edges.length); });
    it(`${name}: nodes filter map chain preserves = nodes`, () => { expect(diagram.nodes.filter(() => true).map(n => n)).toEqual(diagram.nodes); });
  }
});
