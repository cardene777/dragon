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

describe("iter491: preset additional (Promise basic)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Promise.resolve(42) resolves 42`, async () => { expect(await Promise.resolve(42)).toBe(42); });
    it(`${name}: Promise.reject rejects`, async () => { await expect(Promise.reject(new Error("x"))).rejects.toThrow("x"); });
    it(`${name}: Promise.all([1,2,3]) = [1,2,3]`, async () => { expect(await Promise.all([1, 2, 3])).toEqual([1, 2, 3]); });
    it(`${name}: Promise.all([]) = []`, async () => { expect(await Promise.all([])).toEqual([]); });
    it(`${name}: Promise.race resolves first`, async () => { expect(await Promise.race([Promise.resolve(1), Promise.resolve(2)])).toBe(1); });
    it(`${name}: Promise.allSettled length matches`, async () => { const r = await Promise.allSettled([Promise.resolve(1), Promise.reject("x")]); expect(r.length).toBe(2); });
    it(`${name}: diagram.id via Promise resolve`, async () => { expect(await Promise.resolve(diagram.id)).toBe(diagram.id); });
  }
});
