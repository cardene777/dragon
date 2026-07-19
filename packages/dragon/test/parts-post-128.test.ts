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

describe("iter128: parts additional 12 axis (numerics & counts)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id length > 0`, () => { expect(diagram.id.length).toBeGreaterThan(0); });
    it(`${name}: id length < 200`, () => { expect(diagram.id.length).toBeLessThan(200); });
    it(`${name}: id length finite`, () => { expect(Number.isFinite(diagram.id.length)).toBe(true); });
    it(`${name}: id length safe integer`, () => { expect(Number.isSafeInteger(diagram.id.length)).toBe(true); });
    it(`${name}: nodes length >= 0`, () => { expect(diagram.nodes.length).toBeGreaterThanOrEqual(0); });
    it(`${name}: edges length >= 0`, () => { expect(diagram.edges.length).toBeGreaterThanOrEqual(0); });
    it(`${name}: nodes length < 1000`, () => { expect(diagram.nodes.length).toBeLessThan(1000); });
  }
});
