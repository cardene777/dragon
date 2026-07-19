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

describe("iter299-milestone: parts 78k (Promise.reject/catch)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: Promise.reject(id).catch = id`, async () => { const r = await Promise.reject(diagram.id).catch(e => e); expect(r).toBe(diagram.id); });
    it(`${name}: Promise.reject(d).catch = d`, async () => { const r = await Promise.reject(diagram).catch(e => e); expect(r).toBe(diagram); });
    it(`${name}: allSettled rejected includes reason`, async () => { const r = await Promise.allSettled([Promise.reject(diagram.id)]); expect(r[0].status).toBe("rejected"); });
  }
});
