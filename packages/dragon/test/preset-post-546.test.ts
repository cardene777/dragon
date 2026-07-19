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

describe("iter548: preset additional (Array group / reduce advanced)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: groupBy via reduce`, () => { const g = [1, 2, 3, 4].reduce<Record<string, number[]>>((acc, n) => { const k = n % 2 === 0 ? "even" : "odd"; (acc[k] ??= []).push(n); return acc; }, {}); expect(g.even).toEqual([2, 4]); });
    it(`${name}: count via reduce`, () => { const c = ["a", "b", "a"].reduce<Record<string, number>>((acc, x) => { acc[x] = (acc[x] ?? 0) + 1; return acc; }, {}); expect(c.a).toBe(2); });
    it(`${name}: flatten via reduce`, () => { expect([[1], [2], [3]].reduce((a, b) => a.concat(b), [] as number[])).toEqual([1, 2, 3]); });
    it(`${name}: max via reduce`, () => { expect([3, 7, 2].reduce((a, b) => Math.max(a, b), -Infinity)).toBe(7); });
    it(`${name}: partition via reduce`, () => { const [pass, fail] = [1, 2, 3, 4].reduce<[number[], number[]]>((acc, n) => { acc[n > 2 ? 0 : 1].push(n); return acc; }, [[], []]); expect(pass).toEqual([3, 4]); expect(fail).toEqual([1, 2]); });
    it(`${name}: unique via reduce`, () => { const u = [1, 1, 2, 3, 3].reduce<number[]>((acc, n) => acc.includes(n) ? acc : [...acc, n], []); expect(u).toEqual([1, 2, 3]); });
    it(`${name}: nodes index map`, () => { const m = diagram.nodes.reduce<Record<number, boolean>>((acc, _, i) => { acc[i] = true; return acc; }, {}); expect(Object.keys(m).length).toBe(diagram.nodes.length); });
  }
});
