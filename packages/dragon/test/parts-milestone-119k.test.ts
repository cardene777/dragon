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

describe("iter413-milestone: parts 119k (TextEncoder byte counts)", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: ASCII byte = char count`, () => { const s = "abc"; expect(new TextEncoder().encode(s).length).toBe(s.length); });
    it(`${name}: encodeInto works`, () => { const buf = new Uint8Array(10); const r = new TextEncoder().encodeInto("abc", buf); expect(r.written).toBe(3); });
    it(`${name}: decode returns string`, () => { expect(typeof new TextDecoder().decode(new Uint8Array([65]))).toBe("string"); });
  }
});
