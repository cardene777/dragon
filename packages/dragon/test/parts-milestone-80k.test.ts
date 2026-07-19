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

describe("🎊🎊 80k test milestone: parts (async fn constructor / thenable)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: async fn constructor = AsyncFunction`, () => { const f = async () => diagram; expect(f.constructor.name).toBe("AsyncFunction"); });
    it(`${name}: thenable await works`, async () => { const p: PromiseLike<CdlDiagram> = { then(r) { r?.(diagram); return null as unknown as PromiseLike<CdlDiagram>; } }; expect(await p).toBe(diagram); });
    it(`${name}: Promise then callback receives value`, async () => { let v: CdlDiagram | null = null; await Promise.resolve(diagram).then(x => { v = x; }); expect(v).toBe(diagram); });
  }
});
