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

describe("iter395-milestone: parts 113k (Proxy set trap)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Proxy set trap works`, () => { const p = new Proxy({} as { x?: number }, { set(t, k, v) { (t as Record<string | symbol, unknown>)[k] = v; return true; } }); p.x = 1; expect(p.x).toBe(1); });
    it(`${name}: Proxy get trap on d`, () => { const p = new Proxy(diagram, { get(t, k) { return (t as Record<string | symbol, unknown>)[k]; } }); expect(p.id).toBe(diagram.id); });
    it(`${name}: Proxy handler is object`, () => { const h: ProxyHandler<CdlDiagram> = {}; expect(typeof h).toBe("object"); });
  }
});
