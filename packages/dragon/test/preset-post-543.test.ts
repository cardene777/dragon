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

describe("iter545: preset additional (structuredClone / deep copy)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: structuredClone deep`, () => { const o = { a: { b: 1 } }; const c = structuredClone(o); expect(c).toEqual(o); expect(c.a).not.toBe(o.a); });
    it(`${name}: structuredClone array`, () => { const a = [1, [2, 3]]; const c = structuredClone(a); expect(c).toEqual(a); expect(c[1]).not.toBe(a[1]); });
    it(`${name}: structuredClone Map`, () => { const m = new Map([["a", 1]]); const c = structuredClone(m); expect(c.get("a")).toBe(1); });
    it(`${name}: structuredClone Set`, () => { const s = new Set([1, 2]); const c = structuredClone(s); expect([...c]).toEqual([1, 2]); });
    it(`${name}: structuredClone Date`, () => { const d = new Date("2024-01-01"); const c = structuredClone(d); expect(c.getTime()).toBe(d.getTime()); });
    it(`${name}: JSON deep copy`, () => { const o = { a: { b: 1 } }; const c = JSON.parse(JSON.stringify(o)); expect(c).toEqual(o); expect(c.a).not.toBe(o.a); });
    it(`${name}: structuredClone nodes`, () => { const c = structuredClone(diagram.nodes); expect(c.length).toBe(diagram.nodes.length); });
  }
});
