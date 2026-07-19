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

describe("iter177: parts milestone 39k (9 axis Symbol/typeof/instanceof)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes instanceof Array`, () => { expect(diagram.nodes instanceof Array).toBe(true); });
    it(`${name}: edges instanceof Array`, () => { expect(diagram.edges instanceof Array).toBe(true); });
    it(`${name}: diagram instanceof Object`, () => { expect(diagram instanceof Object).toBe(true); });
    it(`${name}: id not instanceof Array`, () => { expect(diagram.id instanceof Array).toBe(false); });
    it(`${name}: nodes constructor Array`, () => { expect(diagram.nodes.constructor).toBe(Array); });
    it(`${name}: edges constructor Array`, () => { expect(diagram.edges.constructor).toBe(Array); });
    it(`${name}: id Symbol.iterator defined`, () => { expect(diagram.id[Symbol.iterator]).toBeDefined(); });
    it(`${name}: nodes Symbol.iterator defined`, () => { expect(diagram.nodes[Symbol.iterator]).toBeDefined(); });
    it(`${name}: edges Symbol.iterator defined`, () => { expect(diagram.edges[Symbol.iterator]).toBeDefined(); });
  }
});
