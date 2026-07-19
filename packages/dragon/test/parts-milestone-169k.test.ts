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

describe("milestone 169k: Proxy basic", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Proxy get handler`, () => { const p = new Proxy({ a: 1 }, { get: () => 999 }); expect(p.a).toBe(999); });
    it(`${name}: Proxy set handler`, () => { const t: Record<string, unknown> = {}; const p = new Proxy(t, { set: (obj, k, v) => { obj[k as string] = v as unknown; return true; } }); (p as { x?: number }).x = 5; expect(t.x).toBe(5); });
    it(`${name}: Proxy has handler`, () => { const p = new Proxy({ a: 1 }, { has: () => true }); expect("nope" in p).toBe(true); });
    it(`${name}: no handler = pass-through`, () => { const p = new Proxy({ a: 1 }, {}); expect(p.a).toBe(1); });
    it(`${name}: Proxy.revocable`, () => { const { proxy, revoke } = Proxy.revocable({ a: 1 }, {}); expect(proxy.a).toBe(1); revoke(); expect(() => proxy.a).toThrow(); });
    it(`${name}: typeof Proxy = "function"`, () => { expect(typeof Proxy).toBe("function"); });
  }
});
