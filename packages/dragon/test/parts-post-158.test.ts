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

describe("iter158: parts additional (misc)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id defined`, () => { expect(diagram.id).toBeDefined(); });
    it(`${name}: nodes defined`, () => { expect(diagram.nodes).toBeDefined(); });
    it(`${name}: edges defined`, () => { expect(diagram.edges).toBeDefined(); });
    it(`${name}: id not undefined`, () => { expect(diagram.id).not.toBe(undefined); });
    it(`${name}: nodes not undefined`, () => { expect(diagram.nodes).not.toBe(undefined); });
    it(`${name}: edges not undefined`, () => { expect(diagram.edges).not.toBe(undefined); });
    it(`${name}: id not empty string`, () => { expect(diagram.id).not.toBe(""); });
  }
});
