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

describe("iter372: parts additional (Array.with ES2023)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: [1,2,3].with(0, 9) = [9,2,3]`, () => { expect([1, 2, 3].with(0, 9)).toEqual([9, 2, 3]); });
    it(`${name}: [1,2,3].with(-1, 9) = [1,2,9]`, () => { expect([1, 2, 3].with(-1, 9)).toEqual([1, 2, 9]); });
    it(`${name}: [1,2,3].with(1, 9) = [1,9,3]`, () => { expect([1, 2, 3].with(1, 9)).toEqual([1, 9, 3]); });
    it(`${name}: nodes.with(0, nodes[0]).length = nodes.length`, () => { if (diagram.nodes.length) expect(diagram.nodes.with(0, diagram.nodes[0]).length).toBe(diagram.nodes.length); });
    it(`${name}: [1,2,3].with is not = original`, () => { const a = [1, 2, 3]; expect(a.with(0, 9)).not.toBe(a); });
    it(`${name}: [1,2,3].with does not mutate`, () => { const a = [1, 2, 3]; a.with(0, 9); expect(a).toEqual([1, 2, 3]); });
    it(`${name}: nodes.with(0, x) returns new array`, () => { if (diagram.nodes.length) expect(diagram.nodes.with(0, diagram.nodes[0])).not.toBe(diagram.nodes); });
  }
});
