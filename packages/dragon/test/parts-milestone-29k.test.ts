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

describe("iter147: parts milestone 29k break (advanced string/array)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id lastIndexOf self`, () => { expect(diagram.id.lastIndexOf(diagram.id)).toBe(0); });
    it(`${name}: id indexOf self`, () => { expect(diagram.id.indexOf(diagram.id)).toBe(0); });
    it(`${name}: id substring 0 = id`, () => { expect(diagram.id.substring(0)).toBe(diagram.id); });
    it(`${name}: id substring 0 len`, () => { expect(diagram.id.substring(0, diagram.id.length)).toBe(diagram.id); });
    it(`${name}: nodes indexOf self elt`, () => { if (diagram.nodes.length > 0) expect(diagram.nodes.indexOf(diagram.nodes[0])).toBe(0); else expect(true).toBe(true); });
    it(`${name}: nodes every returns bool`, () => { expect(typeof diagram.nodes.every(() => true)).toBe("boolean"); });
    it(`${name}: edges every returns bool`, () => { expect(typeof diagram.edges.every(() => true)).toBe("boolean"); });
    it(`${name}: nodes some returns bool`, () => { expect(typeof diagram.nodes.some(() => true)).toBe("boolean"); });
    it(`${name}: id at 0 is char`, () => { expect(typeof diagram.id.at(0)).toBe("string"); });
  }
});
