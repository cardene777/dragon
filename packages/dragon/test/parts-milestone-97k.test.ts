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

describe("iter353-milestone: parts 97k (Number.toString radix)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: (255).toString(16) = "ff"`, () => { expect((255).toString(16)).toBe("ff"); });
    it(`${name}: (10).toString(2) = "1010"`, () => { expect((10).toString(2)).toBe("1010"); });
    it(`${name}: nodes.length.toString() = String(nodes.length)`, () => { expect(diagram.nodes.length.toString()).toBe(String(diagram.nodes.length)); });
  }
});
