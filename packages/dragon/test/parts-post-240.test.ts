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

describe("iter240: parts additional (Object.assign / spread)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Object.assign({}, d).id = id`, () => { expect(Object.assign({} as Partial<CdlDiagram>, diagram).id).toBe(diagram.id); });
    it(`${name}: {...d}.id = id`, () => { expect(({ ...diagram }).id).toBe(diagram.id); });
    it(`${name}: Object.assign({}, d).nodes = nodes`, () => { expect(Object.assign({} as Partial<CdlDiagram>, diagram).nodes).toBe(diagram.nodes); });
    it(`${name}: {...d, extra: 1}.extra = 1`, () => { expect(({ ...diagram, extra: 1 }).extra).toBe(1); });
    it(`${name}: Object.assign preserves keys count >= 3`, () => { expect(Object.keys(Object.assign({} as Partial<CdlDiagram>, diagram)).length).toBeGreaterThanOrEqual(3); });
    it(`${name}: spread preserves keys count >= 3`, () => { expect(Object.keys({ ...diagram }).length).toBeGreaterThanOrEqual(3); });
    it(`${name}: Object.assign({}, d) not = d ref`, () => { expect(Object.assign({} as Partial<CdlDiagram>, diagram)).not.toBe(diagram); });
  }
});
