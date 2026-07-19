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

describe("iter184: parts additional (frozen/sealed check)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: not frozen (mutable)`, () => { expect(Object.isFrozen(diagram)).toBe(false); });
    it(`${name}: not sealed`, () => { expect(Object.isSealed(diagram)).toBe(false); });
    it(`${name}: is extensible`, () => { expect(Object.isExtensible(diagram)).toBe(true); });
    it(`${name}: id descriptor exists`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "id")).toBeDefined(); });
    it(`${name}: id enumerable`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "id")?.enumerable).toBe(true); });
    it(`${name}: id writable`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "id")?.writable).toBe(true); });
    it(`${name}: id configurable`, () => { expect(Object.getOwnPropertyDescriptor(diagram, "id")?.configurable).toBe(true); });
  }
});
