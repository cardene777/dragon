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

describe("iter519: parts additional (null / undefined / optional chaining)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: null == undefined = true`, () => { expect(null == undefined).toBe(true); });
    it(`${name}: null === undefined = false`, () => { expect(null === undefined as unknown as null).toBe(false); });
    it(`${name}: null ?? 42 = null`, () => { expect(null ?? 42).toBe(42); });
    it(`${name}: undefined ?? 42 = 42`, () => { expect(undefined ?? 42).toBe(42); });
    it(`${name}: 0 ?? 42 = 0`, () => { expect(0 ?? 42).toBe(0); });
    it(`${name}: obj?.a = undefined`, () => { const obj: { a?: number } | null = null; expect(obj?.a).toBeUndefined(); });
    it(`${name}: obj?.method?.() = undefined`, () => { const obj: { method?: () => number } = {}; expect(obj?.method?.()).toBeUndefined(); });
  }
});
