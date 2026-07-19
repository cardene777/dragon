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

describe("iter270: parts additional (Object.create / prototype chain)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.create(d).__proto__ = d`, () => { expect(Object.getPrototypeOf(Object.create(diagram))).toBe(diagram); });
    it(`${name}: Object.create(null) proto = null`, () => { expect(Object.getPrototypeOf(Object.create(null))).toBeNull(); });
    it(`${name}: diagram proto = Object.prototype`, () => { expect(Object.getPrototypeOf(diagram)).toBe(Object.prototype); });
    it(`${name}: nodes proto = Array.prototype`, () => { expect(Object.getPrototypeOf(diagram.nodes)).toBe(Array.prototype); });
    it(`${name}: edges proto = Array.prototype`, () => { expect(Object.getPrototypeOf(diagram.edges)).toBe(Array.prototype); });
    it(`${name}: Object.create(d) has id via proto`, () => { expect((Object.create(diagram) as Partial<CdlDiagram>).id).toBe(diagram.id); });
    it(`${name}: id proto = String.prototype`, () => { expect(Object.getPrototypeOf(Object(diagram.id))).toBe(String.prototype); });
  }
});
