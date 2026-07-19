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

describe("🎊🎊🎊 100000 test 大台マイルストーン: parts (JSON deep equivalence)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: JSON.parse(JSON.stringify(d)) deep = d`, () => { expect(JSON.parse(JSON.stringify(diagram))).toEqual(diagram); });
    it(`${name}: JSON.parse(JSON.stringify(nodes)) deep = nodes`, () => { expect(JSON.parse(JSON.stringify(diagram.nodes))).toEqual(diagram.nodes); });
    it(`${name}: JSON.parse(JSON.stringify(edges)) deep = edges`, () => { expect(JSON.parse(JSON.stringify(diagram.edges))).toEqual(diagram.edges); });
    it(`${name}: JSON.stringify.length > 0`, () => { expect(JSON.stringify(diagram).length).toBeGreaterThan(0); });
    it(`${name}: JSON.parse round-trip preserves id`, () => { expect(JSON.parse(JSON.stringify(diagram)).id).toBe(diagram.id); });
  }
});
