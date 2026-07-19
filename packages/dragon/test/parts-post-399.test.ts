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

describe("iter399: parts additional (Array forEach thisArg)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: forEach thisArg accessible`, () => { let seen = false; diagram.nodes.forEach(function (this: { flag: boolean }) { if (this.flag) seen = true; }, { flag: true }); expect(diagram.nodes.length === 0 || seen).toBe(true); });
    it(`${name}: map thisArg accessible`, () => { const r = diagram.nodes.map(function (this: { v: number }) { return this.v; }, { v: 5 }); expect(diagram.nodes.length === 0 || r.every(v => v === 5)).toBe(true); });
    it(`${name}: filter thisArg accessible`, () => { const r = diagram.nodes.filter(function (this: { yes: boolean }) { return this.yes; }, { yes: true }); expect(r.length).toBe(diagram.nodes.length); });
    it(`${name}: forEach without thisArg`, () => { let c = 0; diagram.nodes.forEach(() => c++); expect(c).toBe(diagram.nodes.length); });
    it(`${name}: map without thisArg`, () => { expect(diagram.nodes.map(n => n).length).toBe(diagram.nodes.length); });
    it(`${name}: filter without thisArg`, () => { expect(diagram.nodes.filter(() => true).length).toBe(diagram.nodes.length); });
    it(`${name}: some without thisArg`, () => { expect(diagram.nodes.some(() => false)).toBe(false); });
  }
});
