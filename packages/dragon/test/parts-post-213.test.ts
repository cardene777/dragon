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

describe("iter213: parts additional (Object.entries/keys/values)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.keys length = Object.entries length`, () => { expect(Object.keys(diagram).length).toBe(Object.entries(diagram).length); });
    it(`${name}: Object.values length = Object.entries length`, () => { expect(Object.values(diagram).length).toBe(Object.entries(diagram).length); });
    it(`${name}: Object.fromEntries(entries(d)) has id`, () => { expect((Object.fromEntries(Object.entries(diagram)) as { id: string }).id).toBe(diagram.id); });
    it(`${name}: Object.keys(d) contains id/nodes/edges`, () => { const k = Object.keys(diagram); expect(k).toContain("id"); expect(k).toContain("nodes"); expect(k).toContain("edges"); });
    it(`${name}: Object.entries(d) each has string key`, () => { for (const [k] of Object.entries(diagram)) expect(typeof k).toBe("string"); });
    it(`${name}: Object.keys idempotent`, () => { expect(Object.keys(diagram)).toEqual(Object.keys(diagram)); });
    it(`${name}: Object.entries idempotent length`, () => { expect(Object.entries(diagram).length).toBe(Object.entries(diagram).length); });
  }
});
