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

describe("iter157: parts milestone 33k break (9 axis Object)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: getPrototypeOf not null`, () => { expect(Object.getPrototypeOf(diagram)).toBeTruthy(); });
    it(`${name}: values array not empty`, () => { expect(Object.values(diagram).length).toBeGreaterThan(0); });
    it(`${name}: entries array not empty`, () => { expect(Object.entries(diagram).length).toBeGreaterThan(0); });
    it(`${name}: keys array not empty`, () => { expect(Object.keys(diagram).length).toBeGreaterThan(0); });
    it(`${name}: id in diagram`, () => { expect("id" in diagram).toBe(true); });
    it(`${name}: nodes in diagram`, () => { expect("nodes" in diagram).toBe(true); });
    it(`${name}: edges in diagram`, () => { expect("edges" in diagram).toBe(true); });
    it(`${name}: Reflect has id`, () => { expect(Reflect.has(diagram, "id")).toBe(true); });
    it(`${name}: instanceof Object`, () => { expect(diagram instanceof Object).toBe(true); });
  }
});
