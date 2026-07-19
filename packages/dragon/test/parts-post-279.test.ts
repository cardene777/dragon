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

describe("iter279: parts additional (Object.prototype methods)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.hasOwn(d, "id") = true`, () => { expect(Object.hasOwn(diagram, "id")).toBe(true); });
    it(`${name}: Object.hasOwn(d, "nodes") = true`, () => { expect(Object.hasOwn(diagram, "nodes")).toBe(true); });
    it(`${name}: Object.hasOwn(d, "nonexist") = false`, () => { expect(Object.hasOwn(diagram, "___NOTEXIST___")).toBe(false); });
    it(`${name}: Object.prototype.isPrototypeOf(d) = true`, () => { expect(Object.prototype.isPrototypeOf.call(Object.prototype, diagram)).toBe(true); });
    it(`${name}: Array.prototype.isPrototypeOf(nodes) = true`, () => { expect(Object.prototype.isPrototypeOf.call(Array.prototype, diagram.nodes)).toBe(true); });
    it(`${name}: d.toString() is string`, () => { expect(typeof diagram.toString()).toBe("string"); });
    it(`${name}: d.valueOf() = d (default)`, () => { expect(diagram.valueOf()).toBe(diagram); });
  }
});
