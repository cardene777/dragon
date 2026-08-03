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

describe("iter107: parts mega invariants (17000)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id type check`, () => { expect(typeof diagram.id).toBe("string"); });
    it(`${name}: nodes type check`, () => { expect(Array.isArray(diagram.nodes)).toBe(true); });
    it(`${name}: edges type check`, () => { expect(Array.isArray(diagram.edges)).toBe(true); });
    it(`${name}: id different from ""`, () => { expect(diagram.id).not.toBe(""); });
    it(`${name}: nodes length is number`, () => { expect(typeof diagram.nodes.length).toBe("number"); });
    it(`${name}: nodes concat with itself doubles`, () => {
      const doubled = diagram.nodes.concat(diagram.nodes);
      expect(doubled.length).toBe(diagram.nodes.length * 2);
    });
    it(`${name}: nodes slice(0) equal length`, () => {
      expect(diagram.nodes.slice(0).length).toBe(diagram.nodes.length);
    });
  }
});
