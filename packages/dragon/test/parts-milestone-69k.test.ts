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

describe("iter272-milestone: parts 69k (Reflect.getPrototypeOf / setPrototypeOf)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Reflect.getPrototypeOf(d) = Object.prototype`, () => { expect(Reflect.getPrototypeOf(diagram)).toBe(Object.prototype); });
    it(`${name}: Reflect.getPrototypeOf(nodes) = Array.prototype`, () => { expect(Reflect.getPrototypeOf(diagram.nodes)).toBe(Array.prototype); });
    it(`${name}: Reflect.getPrototypeOf = Object.getPrototypeOf`, () => { expect(Reflect.getPrototypeOf(diagram)).toBe(Object.getPrototypeOf(diagram)); });
  }
});
