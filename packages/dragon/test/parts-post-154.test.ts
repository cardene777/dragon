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

describe("iter154: parts additional (regex-like)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: id matches non-empty`, () => { expect(diagram.id).toMatch(/./); });
    it(`${name}: id matches printable`, () => { expect(diagram.id).toMatch(/[\x20-\x7e]/); });
    it(`${name}: id no double dash`, () => { expect(diagram.id.includes("--")).toBe(false); });
    it(`${name}: id not start dash`, () => { expect(diagram.id.startsWith("-")).toBe(false); });
    it(`${name}: id not end dash`, () => { expect(diagram.id.endsWith("-")).toBe(false); });
    it(`${name}: id split "-" first non-empty`, () => { expect(diagram.id.split("-")[0].length).toBeGreaterThan(0); });
    it(`${name}: id split "-" last non-empty`, () => { const p = diagram.id.split("-"); expect(p[p.length - 1].length).toBeGreaterThan(0); });
  }
});
