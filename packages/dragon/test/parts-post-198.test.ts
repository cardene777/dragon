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

describe("iter198: parts additional (concatenation)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id concat id length x2`, () => { expect(diagram.id.concat(diagram.id).length).toBe(diagram.id.length * 2); });
    it(`${name}: id + id length x2`, () => { expect((diagram.id + diagram.id).length).toBe(diagram.id.length * 2); });
    it(`${name}: nodes concat empty = nodes`, () => { expect(diagram.nodes.concat().length).toBe(diagram.nodes.length); });
    it(`${name}: edges concat empty = edges`, () => { expect(diagram.edges.concat().length).toBe(diagram.edges.length); });
    it(`${name}: nodes concat nodes = 2x`, () => { expect(diagram.nodes.concat(diagram.nodes).length).toBe(diagram.nodes.length * 2); });
    it(`${name}: id concat empty = id`, () => { expect(diagram.id.concat("")).toBe(diagram.id); });
    it(`${name}: "" concat id = id`, () => { expect("".concat(diagram.id)).toBe(diagram.id); });
  }
});
