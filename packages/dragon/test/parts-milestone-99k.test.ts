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

describe("iter359-milestone: parts 99k (JSON stringify with numeric indent)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: JSON stringify with 0 indent = no space`, () => { expect(JSON.stringify(diagram, null, 0)).toBe(JSON.stringify(diagram)); });
    it(`${name}: JSON stringify with 1 indent contains " "`, () => { expect(JSON.stringify(diagram, null, 1)).toContain(" "); });
    it(`${name}: JSON stringify with 10 indent OK`, () => { expect(typeof JSON.stringify(diagram, null, 10)).toBe("string"); });
  }
});
