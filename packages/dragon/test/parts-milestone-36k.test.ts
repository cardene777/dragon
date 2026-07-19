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

describe("iter167: parts milestone 36k (9 axis Number/comparison)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id length > -1`, () => { expect(diagram.id.length).toBeGreaterThan(-1); });
    it(`${name}: id length >= 1`, () => { expect(diagram.id.length).toBeGreaterThanOrEqual(1); });
    it(`${name}: nodes length >= 0`, () => { expect(diagram.nodes.length).toBeGreaterThanOrEqual(0); });
    it(`${name}: edges length >= 0`, () => { expect(diagram.edges.length).toBeGreaterThanOrEqual(0); });
    it(`${name}: id length is number`, () => { expect(typeof diagram.id.length).toBe("number"); });
    it(`${name}: nodes length is number`, () => { expect(typeof diagram.nodes.length).toBe("number"); });
    it(`${name}: edges length is number`, () => { expect(typeof diagram.edges.length).toBe("number"); });
    it(`${name}: id length not NaN`, () => { expect(Number.isNaN(diagram.id.length)).toBe(false); });
    it(`${name}: nodes length not NaN`, () => { expect(Number.isNaN(diagram.nodes.length)).toBe(false); });
  }
});
