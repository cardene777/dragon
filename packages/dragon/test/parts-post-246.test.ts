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

describe("iter246: parts additional (Array keys/values/entries iterator)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: [...nodes.keys()].length = nodes length`, () => { expect([...diagram.nodes.keys()].length).toBe(diagram.nodes.length); });
    it(`${name}: [...nodes.values()].length = nodes length`, () => { expect([...diagram.nodes.values()].length).toBe(diagram.nodes.length); });
    it(`${name}: [...nodes.entries()].length = nodes length`, () => { expect([...diagram.nodes.entries()].length).toBe(diagram.nodes.length); });
    it(`${name}: [...edges.keys()].length = edges length`, () => { expect([...diagram.edges.keys()].length).toBe(diagram.edges.length); });
    it(`${name}: [...edges.values()].length = edges length`, () => { expect([...diagram.edges.values()].length).toBe(diagram.edges.length); });
    it(`${name}: [...nodes.values()] equals nodes`, () => { expect([...diagram.nodes.values()]).toEqual(diagram.nodes); });
    it(`${name}: [...nodes.keys()] is index array`, () => { expect([...diagram.nodes.keys()]).toEqual(diagram.nodes.map((_, i) => i)); });
  }
});
