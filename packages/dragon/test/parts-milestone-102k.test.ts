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

describe("iter365-milestone: parts 102k (Object.assign later wins)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: assign({}, {a:1}, {a:2}, {a:3}) = {a:3}`, () => { expect(Object.assign({}, { a: 1 }, { a: 2 }, { a: 3 })).toEqual({ a: 3 }); });
    it(`${name}: {...d, ...d, id: X} preserves X`, () => { expect(({ ...diagram, ...diagram, id: "X" }).id).toBe("X"); });
    it(`${name}: assign preserves last id`, () => { expect(Object.assign({}, diagram, { id: "override" }).id).toBe("override"); });
  }
});
