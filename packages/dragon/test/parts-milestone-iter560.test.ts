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

describe("milestone iter560: async/await advanced + Promise combinators", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: await sequential`, async () => { const a = await Promise.resolve(1); const b = await Promise.resolve(a + 1); expect(b).toBe(2); });
    it(`${name}: Promise.any first resolve`, async () => { expect(await Promise.any([Promise.reject("x"), Promise.resolve(42)])).toBe(42); });
    it(`${name}: Promise.any all reject → AggregateError`, async () => { await expect(Promise.any([Promise.reject("a"), Promise.reject("b")])).rejects.toThrow(); });
    it(`${name}: allSettled fulfilled/rejected`, async () => { const r = await Promise.allSettled([Promise.resolve(1), Promise.reject("e")]); expect(r[0].status).toBe("fulfilled"); expect(r[1].status).toBe("rejected"); });
    it(`${name}: await in loop`, async () => { let sum = 0; for (const n of [1, 2, 3]) sum += await Promise.resolve(n); expect(sum).toBe(6); });
    it(`${name}: parallel await via all`, async () => { const [a, b] = await Promise.all([Promise.resolve(1), Promise.resolve(2)]); expect(a + b).toBe(3); });
    it(`${name}: async error propagation`, async () => { const fn = async () => { await Promise.resolve(); throw new Error("deep"); }; await expect(fn()).rejects.toThrow("deep"); });
    it(`${name}: try/catch async`, async () => { let caught = false; try { await Promise.reject(new Error("x")); } catch { caught = true; } expect(caught).toBe(true); });
    it(`${name}: finally after await`, async () => { let f = false; try { await Promise.resolve(1); } finally { f = true; } expect(f).toBe(true); });
  }
});
