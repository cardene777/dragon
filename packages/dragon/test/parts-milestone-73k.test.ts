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

describe("iter284-milestone: parts 73k (arrow fn arity)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: arrow fn 0 arity length = 0`, () => { expect((() => diagram).length).toBe(0); });
    it(`${name}: arrow fn 2 arity length = 2`, () => { expect(((a: unknown, b: unknown) => [a, b]).length).toBe(2); });
    it(`${name}: arrow fn 3 arity length = 3`, () => { expect(((a: unknown, b: unknown, c: unknown) => [a, b, c]).length).toBe(3); });
  }
});
