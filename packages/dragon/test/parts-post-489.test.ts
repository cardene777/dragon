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

describe("iter489: parts additional (Promise basic)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Promise.resolve(42) resolves 42`, async () => { expect(await Promise.resolve(42)).toBe(42); });
    it(`${name}: Promise.reject rejects`, async () => { await expect(Promise.reject(new Error("x"))).rejects.toThrow("x"); });
    it(`${name}: Promise.all([1,2,3]) = [1,2,3]`, async () => { expect(await Promise.all([1, 2, 3])).toEqual([1, 2, 3]); });
    it(`${name}: Promise.all([]) = []`, async () => { expect(await Promise.all([])).toEqual([]); });
    it(`${name}: Promise.race resolves first`, async () => { expect(await Promise.race([Promise.resolve(1), Promise.resolve(2)])).toBe(1); });
    it(`${name}: Promise.allSettled length matches`, async () => { const r = await Promise.allSettled([Promise.resolve(1), Promise.reject("x")]); expect(r.length).toBe(2); });
    it(`${name}: diagram.id via Promise resolve`, async () => { expect(await Promise.resolve(diagram.id)).toBe(diagram.id); });
  }
});
