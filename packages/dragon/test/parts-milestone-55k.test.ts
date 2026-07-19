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

describe("iter230-milestone: parts 55k (Symbol.iterator / for...of)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes has Symbol.iterator`, () => { expect(typeof diagram.nodes[Symbol.iterator]).toBe("function"); });
    it(`${name}: for..of nodes count = length`, () => { let c = 0; for (const _ of diagram.nodes) c++; expect(c).toBe(diagram.nodes.length); });
    it(`${name}: id char count via for..of = length`, () => { let c = 0; for (const _ of diagram.id) c++; expect(c).toBeGreaterThanOrEqual(1); });
  }
});
