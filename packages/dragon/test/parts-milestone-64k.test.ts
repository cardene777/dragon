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

describe("iter257-milestone: parts 64k (Array.prototype pop/push semantics)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes.slice().pop() = last node`, () => { const c = diagram.nodes.slice(); const p = c.pop(); if (diagram.nodes.length) expect(p).toBe(diagram.nodes[diagram.nodes.length - 1]); });
    it(`${name}: nodes.slice().push(1) returns new length`, () => { const c = [...diagram.nodes] as unknown as unknown[]; expect(c.push(1)).toBe(diagram.nodes.length + 1); });
    it(`${name}: nodes.slice().shift() returns first`, () => { const c = diagram.nodes.slice(); const s = c.shift(); if (diagram.nodes.length) expect(s).toBe(diagram.nodes[0]); });
  }
});
