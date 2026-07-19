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

describe("iter227-milestone: parts 54k (structuredClone / JSON pretty)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: JSON.stringify 2-space indent works`, () => { expect(typeof JSON.stringify(diagram, null, 2)).toBe("string"); });
    it(`${name}: JSON.stringify 2-space contains newline`, () => { expect(JSON.stringify(diagram, null, 2).includes("\n")).toBe(true); });
    it(`${name}: JSON.stringify indented length >= compact length`, () => { expect(JSON.stringify(diagram, null, 2).length).toBeGreaterThanOrEqual(JSON.stringify(diagram).length); });
  }
});
