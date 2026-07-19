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

describe("iter125: parts additional 11 axis", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id no colon`, () => { expect(diagram.id).not.toContain(":"); });
    it(`${name}: id no semicolon`, () => { expect(diagram.id).not.toContain(";"); });
    it(`${name}: id no comma`, () => { expect(diagram.id).not.toContain(","); });
    it(`${name}: id no equals`, () => { expect(diagram.id).not.toContain("="); });
    it(`${name}: id no bracket open`, () => { expect(diagram.id).not.toContain("["); });
    it(`${name}: id no bracket close`, () => { expect(diagram.id).not.toContain("]"); });
    it(`${name}: id no dollar`, () => { expect(diagram.id).not.toContain("$"); });
  }
});
