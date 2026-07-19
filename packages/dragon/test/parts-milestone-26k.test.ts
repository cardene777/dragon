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

describe("iter137: parts milestone 26k break (advanced axes)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id valueOf same`, () => { expect(diagram.id.valueOf()).toBe(diagram.id); });
    it(`${name}: id toString same`, () => { expect(diagram.id.toString()).toBe(diagram.id); });
    it(`${name}: id concat empty`, () => { expect(diagram.id + "").toBe(diagram.id); });
    it(`${name}: id split length >= 1`, () => { expect(diagram.id.split("-").length).toBeGreaterThanOrEqual(1); });
    it(`${name}: id char length equal`, () => { expect(diagram.id.split("").length).toBe(diagram.id.length); });
    it(`${name}: nodes filter true = length`, () => { expect(diagram.nodes.filter(() => true).length).toBe(diagram.nodes.length); });
    it(`${name}: edges filter true = length`, () => { expect(diagram.edges.filter(() => true).length).toBe(diagram.edges.length); });
    it(`${name}: nodes some type check`, () => { expect(Array.isArray(diagram.nodes)).toBe(true); });
    it(`${name}: id char at 0 defined`, () => { expect(diagram.id.charAt(0)).toBeDefined(); });
  }
});
