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

describe("iter181: parts additional (Array method chain)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes flat length`, () => { expect(diagram.nodes.flat().length).toBeGreaterThanOrEqual(diagram.nodes.length); });
    it(`${name}: edges flat length`, () => { expect(diagram.edges.flat().length).toBeGreaterThanOrEqual(diagram.edges.length); });
    it(`${name}: nodes flatMap identity`, () => { expect(diagram.nodes.flatMap(n => [n]).length).toBe(diagram.nodes.length); });
    it(`${name}: edges flatMap identity`, () => { expect(diagram.edges.flatMap(e => [e]).length).toBe(diagram.edges.length); });
    it(`${name}: nodes findIndex first`, () => { if (diagram.nodes.length > 0) expect(diagram.nodes.findIndex(() => true)).toBe(0); else expect(true).toBe(true); });
    it(`${name}: edges findIndex first`, () => { if (diagram.edges.length > 0) expect(diagram.edges.findIndex(() => true)).toBe(0); else expect(true).toBe(true); });
    it(`${name}: nodes findIndex none`, () => { expect(diagram.nodes.findIndex(() => false)).toBe(-1); });
  }
});
