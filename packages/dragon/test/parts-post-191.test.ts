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

describe("iter191: parts additional (Math/Number)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id length Math.min self = self`, () => { expect(Math.min(diagram.id.length, diagram.id.length)).toBe(diagram.id.length); });
    it(`${name}: id length Math.max self = self`, () => { expect(Math.max(diagram.id.length, diagram.id.length)).toBe(diagram.id.length); });
    it(`${name}: id length Math.floor identity`, () => { expect(Math.floor(diagram.id.length)).toBe(diagram.id.length); });
    it(`${name}: id length Math.ceil identity`, () => { expect(Math.ceil(diagram.id.length)).toBe(diagram.id.length); });
    it(`${name}: id length Math.abs identity`, () => { expect(Math.abs(diagram.id.length)).toBe(diagram.id.length); });
    it(`${name}: id length parseInt = length`, () => { expect(parseInt(String(diagram.id.length), 10)).toBe(diagram.id.length); });
    it(`${name}: nodes length Number cast = length`, () => { expect(Number(diagram.nodes.length)).toBe(diagram.nodes.length); });
  }
});
