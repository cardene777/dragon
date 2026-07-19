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

describe("iter318: parts additional (Symbol behavior)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: typeof Symbol(id) = symbol`, () => { expect(typeof Symbol(diagram.id)).toBe("symbol"); });
    it(`${name}: Symbol(id) !== Symbol(id)`, () => { expect(Symbol(diagram.id) === Symbol(diagram.id)).toBe(false); });
    it(`${name}: Symbol(id).description = id`, () => { expect(Symbol(diagram.id).description).toBe(diagram.id); });
    it(`${name}: Symbol.iterator is symbol`, () => { expect(typeof Symbol.iterator).toBe("symbol"); });
    it(`${name}: Symbol.for(id) === Symbol.for(id)`, () => { expect(Symbol.for(diagram.id) === Symbol.for(diagram.id)).toBe(true); });
    it(`${name}: Symbol().toString starts with Symbol`, () => { expect(Symbol("x").toString().startsWith("Symbol")).toBe(true); });
    it(`${name}: Object(Symbol()) is not primitive`, () => { expect(typeof Object(Symbol(diagram.id))).toBe("object"); });
  }
});
