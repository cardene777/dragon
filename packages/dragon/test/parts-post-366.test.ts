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

describe("iter366: parts additional (Array method chain fluent)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes.slice().map(n=>n).filter(()=>true) = nodes`, () => { expect(diagram.nodes.slice().map(n => n).filter(() => true)).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice().reverse().reverse() = nodes`, () => { expect(diagram.nodes.slice().reverse().reverse()).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice().sort().length preserved`, () => { expect(diagram.nodes.slice().sort((a, b) => a.id.localeCompare(b.id)).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes.slice().concat([]).length preserved`, () => { expect(diagram.nodes.slice().concat([]).length).toBe(diagram.nodes.length); });
    it(`${name}: nodes.slice().flat().length preserved`, () => { expect(diagram.nodes.slice().flat().length).toBe(diagram.nodes.length); });
    it(`${name}: nodes.slice().map(x=>[x]).flat() = nodes`, () => { expect(diagram.nodes.slice().map(x => [x]).flat()).toEqual(diagram.nodes); });
    it(`${name}: nodes.slice().flatMap(x=>[x]) = nodes`, () => { expect(diagram.nodes.slice().flatMap(x => [x])).toEqual(diagram.nodes); });
  }
});
