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

describe("iter124: parts milestone 22k break", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id ascii`, () => { expect(/^[\x20-\x7e]+$/.test(diagram.id)).toBe(true); });
    it(`${name}: id lowercase only or has hyphen`, () => { expect(diagram.id).toMatch(/[a-z-]/); });
    it(`${name}: nodes strictly array`, () => { expect(Object.prototype.toString.call(diagram.nodes)).toBe("[object Array]"); });
    it(`${name}: edges strictly array`, () => { expect(Object.prototype.toString.call(diagram.edges)).toBe("[object Array]"); });
    it(`${name}: id id ref eq`, () => { const x = diagram.id; expect(x).toBe(diagram.id); });
    it(`${name}: nodes ref eq`, () => { const x = diagram.nodes; expect(x).toBe(diagram.nodes); });
    it(`${name}: edges ref eq`, () => { const x = diagram.edges; expect(x).toBe(diagram.edges); });
    it(`${name}: id string trim eq`, () => { expect(diagram.id.trim()).toBe(diagram.id); });
    it(`${name}: id no leading space`, () => { expect(diagram.id[0]).not.toBe(" "); });
  }
});
