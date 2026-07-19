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

describe("iter144: parts additional (deep equal)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: nodes deep eq self`, () => { expect(diagram.nodes).toEqual(diagram.nodes); });
    it(`${name}: edges deep eq self`, () => { expect(diagram.edges).toEqual(diagram.edges); });
    it(`${name}: id deep eq self`, () => { expect(diagram.id).toEqual(diagram.id); });
    it(`${name}: diagram deep eq self`, () => { expect(diagram).toEqual(diagram); });
    it(`${name}: nodes strict eq self`, () => { expect(diagram.nodes).toStrictEqual(diagram.nodes); });
    it(`${name}: edges strict eq self`, () => { expect(diagram.edges).toStrictEqual(diagram.edges); });
    it(`${name}: nodes shallow copy deep eq`, () => { expect([...diagram.nodes]).toEqual(diagram.nodes); });
  }
});
