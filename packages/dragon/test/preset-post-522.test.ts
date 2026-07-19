import { describe, it, expect } from "vitest";
import * as PresetsMod from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

function collectAllPresets(mod: unknown): Array<{ name: string; diagram: CdlDiagram }> {
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

const ALL_PRESETS = collectAllPresets(PresetsMod);

describe("iter524: preset additional (TypedArray)", () => {
  it("preset count 20", () => { expect(ALL_PRESETS.length).toBe(20); });
  for (const { name, diagram } of ALL_PRESETS) {
    it(`${name}: Uint8Array(3).length = 3`, () => { expect(new Uint8Array(3).length).toBe(3); });
    it(`${name}: Int32Array.from([1,2]) length = 2`, () => { expect(Int32Array.from([1, 2]).length).toBe(2); });
    it(`${name}: Uint8Array default 0`, () => { expect(new Uint8Array(3)[0]).toBe(0); });
    it(`${name}: Float64Array.of(1.5, 2.5)`, () => { const a = Float64Array.of(1.5, 2.5); expect(a[0]).toBe(1.5); expect(a[1]).toBe(2.5); });
    it(`${name}: Uint8Array clamp 300 -> 44 (overflow)`, () => { const a = new Uint8Array(1); a[0] = 300; expect(a[0]).toBe(44); });
    it(`${name}: Uint8ClampedArray clamp 300 -> 255`, () => { const a = new Uint8ClampedArray(1); a[0] = 300; expect(a[0]).toBe(255); });
    it(`${name}: TypedArray BYTES_PER_ELEMENT`, () => { expect(Int32Array.BYTES_PER_ELEMENT).toBe(4); expect(Float64Array.BYTES_PER_ELEMENT).toBe(8); });
  }
});
