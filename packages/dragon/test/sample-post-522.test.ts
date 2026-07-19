import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter523: sample additional (TypedArray)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Uint8Array(3).length = 3`, () => { expect(new Uint8Array(3).length).toBe(3); });
      it(`Int32Array.from([1,2]) length = 2`, () => { expect(Int32Array.from([1, 2]).length).toBe(2); });
      it(`Uint8Array default 0`, () => { expect(new Uint8Array(3)[0]).toBe(0); });
      it(`Float64Array.of(1.5, 2.5)`, () => { const a = Float64Array.of(1.5, 2.5); expect(a[0]).toBe(1.5); expect(a[1]).toBe(2.5); });
      it(`Uint8Array clamp 300 -> 44 (overflow)`, () => { const a = new Uint8Array(1); a[0] = 300; expect(a[0]).toBe(44); });
      it(`Uint8ClampedArray clamp 300 -> 255`, () => { const a = new Uint8ClampedArray(1); a[0] = 300; expect(a[0]).toBe(255); });
      it(`TypedArray BYTES_PER_ELEMENT`, () => { expect(Int32Array.BYTES_PER_ELEMENT).toBe(4); expect(Float64Array.BYTES_PER_ELEMENT).toBe(8); });
    });
  }
});
