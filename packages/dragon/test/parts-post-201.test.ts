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

describe("iter201: parts additional (Array.reverse/sort behavior)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes slice reverse reverse = orig`, () => { expect(diagram.nodes.slice().reverse().reverse()).toEqual(diagram.nodes); });
    it(`${name}: edges slice reverse reverse = orig`, () => { expect(diagram.edges.slice().reverse().reverse()).toEqual(diagram.edges); });
    it(`${name}: nodes slice reverse length = orig`, () => { expect(diagram.nodes.slice().reverse().length).toBe(diagram.nodes.length); });
    it(`${name}: id split reverse join reverse = id`, () => { expect(diagram.id.split("").reverse().join("").split("").reverse().join("")).toBe(diagram.id); });
    it(`${name}: nodes slice sort by id length preserves count`, () => { expect(diagram.nodes.slice().sort((a, b) => a.id.length - b.id.length).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes slice sort stable idempotent`, () => { const s = diagram.nodes.slice().sort((a, b) => a.id.localeCompare(b.id)); expect(s.slice().sort((a, b) => a.id.localeCompare(b.id))).toEqual(s); });
    it(`${name}: edges slice sort by from preserves length`, () => { expect(diagram.edges.slice().sort((a, b) => a.from.localeCompare(b.from)).length).toBe(diagram.edges.length); });
  }
});
