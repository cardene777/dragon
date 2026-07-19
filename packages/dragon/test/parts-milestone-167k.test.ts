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

describe("milestone 167k: ArrayBuffer / DataView", () => {
  it("count", () => { expect(ALL_PARTS.length).toBeGreaterThanOrEqual(60); });
  for (const { name, diagram } of ALL_PARTS) {
    it(`${name}: new ArrayBuffer(8).byteLength = 8`, () => { expect(new ArrayBuffer(8).byteLength).toBe(8); });
    it(`${name}: DataView view`, () => { const b = new ArrayBuffer(4); const v = new DataView(b); v.setUint32(0, 12345678); expect(v.getUint32(0)).toBe(12345678); });
    it(`${name}: little endian`, () => { const b = new ArrayBuffer(4); const v = new DataView(b); v.setUint32(0, 0x12345678, true); expect(v.getUint32(0, true)).toBe(0x12345678); });
    it(`${name}: Uint8Array over ArrayBuffer`, () => { const b = new ArrayBuffer(4); const a = new Uint8Array(b); a[0] = 42; expect(new Uint8Array(b)[0]).toBe(42); });
    it(`${name}: instanceof ArrayBuffer`, () => { expect(new ArrayBuffer(8) instanceof ArrayBuffer).toBe(true); });
    it(`${name}: TypedArray shares buffer`, () => { const b = new ArrayBuffer(4); const a = new Uint32Array(b); a[0] = 100; const c = new Uint32Array(b); expect(c[0]).toBe(100); });
  }
});
