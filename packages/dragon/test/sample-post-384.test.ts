import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter385: sample additional (TypedArray basics)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Uint8Array(10).length = 10`, () => { expect(new Uint8Array(10).length).toBe(10); });
      it(`new Uint8Array([1,2,3]).length = 3`, () => { expect(new Uint8Array([1, 2, 3]).length).toBe(3); });
      it(`new Uint16Array(slug.length).length = slug.length`, () => { expect(new Uint16Array(sample.slug.length).length).toBe(sample.slug.length); });
      it(`new Uint16Array(label.length).length = label.length`, () => { expect(new Uint16Array(sample.label.length).length).toBe(sample.label.length); });
      it(`new Int8Array(0).length = 0`, () => { expect(new Int8Array(0).length).toBe(0); });
      it(`Uint8Array BYTES_PER_ELEMENT = 1`, () => { expect(Uint8Array.BYTES_PER_ELEMENT).toBe(1); });
      it(`Uint32Array BYTES_PER_ELEMENT = 4`, () => { expect(Uint32Array.BYTES_PER_ELEMENT).toBe(4); });
    });
  }
});
