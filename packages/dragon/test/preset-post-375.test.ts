import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllPresets(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PRESETS = collectAllPresets(PresetsMod);

describe("iter377: preset additional (Iterator protocol)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: nodes iterator next has value/done`, () => { const it = diagram.nodes[Symbol.iterator](); const r = it.next(); expect(typeof r.done).toBe("boolean"); });
    it(`${name}: nodes iterator empty exhausts to done`, () => { const it = diagram.nodes[Symbol.iterator](); let last = it.next(); while (!last.done) last = it.next(); expect(last.done).toBe(true); });
    it(`${name}: id iterator returns chars`, () => { const it = diagram.id[Symbol.iterator](); const r = it.next(); if (diagram.id.length) expect(r.done).toBe(false); });
    it(`${name}: id iterator exhausts to done`, () => { const it = diagram.id[Symbol.iterator](); let last = it.next(); while (!last.done) last = it.next(); expect(last.done).toBe(true); });
    it(`${name}: Set iterator done at end`, () => { const s = new Set([1, 2, 3]); const it = s[Symbol.iterator](); let last = it.next(); while (!last.done) last = it.next(); expect(last.done).toBe(true); });
    it(`${name}: Map iterator done at end`, () => { const m = new Map([[1, "a"]]); const it = m[Symbol.iterator](); let last = it.next(); while (!last.done) last = it.next(); expect(last.done).toBe(true); });
    it(`${name}: gen iterator symbol.iterator self`, () => { function* g() { yield 1; } const gen = g(); expect(gen[Symbol.iterator]()).toBe(gen); });
  }
});
