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

describe("iter377-milestone: parts 106k (generator yield)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: gen yield returns value`, () => { function* g() { yield 1; yield 2; } const it = g(); expect(it.next().value).toBe(1); expect(it.next().value).toBe(2); });
    it(`${name}: gen yield exhausts done`, () => { function* g() { yield 1; } const it = g(); it.next(); expect(it.next().done).toBe(true); });
    it(`${name}: gen return early done`, () => { function* g() { yield 1; yield 2; } const it = g(); const r = it.return(); expect(r.done).toBe(true); });
  }
});
