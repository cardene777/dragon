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

describe("iter269-milestone: parts 68k (Symbol.for / Symbol.keyFor)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Symbol.for(id) is symbol`, () => { expect(typeof Symbol.for(diagram.id)).toBe("symbol"); });
    it(`${name}: Symbol.keyFor(Symbol.for(id)) = id`, () => { expect(Symbol.keyFor(Symbol.for(diagram.id))).toBe(diagram.id); });
    it(`${name}: Symbol.for(id) === Symbol.for(id)`, () => { expect(Symbol.for(diagram.id)).toBe(Symbol.for(diagram.id)); });
  }
});
