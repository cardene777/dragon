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

describe("iter178: parts additional (existential/hasOwn)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.hasOwn id`, () => { expect(Object.hasOwn(diagram as object, "id")).toBe(true); });
    it(`${name}: Object.hasOwn nodes`, () => { expect(Object.hasOwn(diagram as object, "nodes")).toBe(true); });
    it(`${name}: Object.hasOwn edges`, () => { expect(Object.hasOwn(diagram as object, "edges")).toBe(true); });
    it(`${name}: Object.hasOwn xxx not`, () => { expect(Object.hasOwn(diagram as object, "__xxx__")).toBe(false); });
    it(`${name}: id property propertyIsEnumerable`, () => { expect(Object.prototype.propertyIsEnumerable.call(diagram, "id")).toBe(true); });
    it(`${name}: nodes propertyIsEnumerable`, () => { expect(Object.prototype.propertyIsEnumerable.call(diagram, "nodes")).toBe(true); });
    it(`${name}: edges propertyIsEnumerable`, () => { expect(Object.prototype.propertyIsEnumerable.call(diagram, "edges")).toBe(true); });
  }
});
