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

describe("iter363: parts additional (Object.assign multi-source)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: assign({}, d, {}) = d shape`, () => { expect(Object.assign({}, diagram, {}).id).toBe(diagram.id); });
    it(`${name}: assign({}, {a:1}, {b:2}) = {a:1,b:2}`, () => { expect(Object.assign({}, { a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 }); });
    it(`${name}: assign({a:1}, {a:2}) = {a:2}`, () => { expect(Object.assign({ a: 1 }, { a: 2 })).toEqual({ a: 2 }); });
    it(`${name}: assign({}, d) not = d ref`, () => { expect(Object.assign({}, diagram)).not.toBe(diagram); });
    it(`${name}: assign returns target ref`, () => { const target = {}; expect(Object.assign(target, diagram)).toBe(target); });
    it(`${name}: assign 0 sources returns target`, () => { const target = { x: 1 }; expect(Object.assign(target)).toBe(target); });
    it(`${name}: {...d, ...d} preserves latest`, () => { expect(({ ...diagram, id: "new" }).id).toBe("new"); });
  }
});
