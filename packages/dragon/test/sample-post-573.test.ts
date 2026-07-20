import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter574: sample additional (Array fill/copyWithin comprehensive)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`fill negative start`, () => { expect([1, 2, 3, 4].fill(0, -2)).toEqual([1, 2, 0, 0]); });
      it(`fill negative end`, () => { expect([1, 2, 3, 4].fill(0, 1, -1)).toEqual([1, 0, 0, 4]); });
      it(`copyWithin negative target`, () => { expect([1, 2, 3, 4, 5].copyWithin(-2, 0)).toEqual([1, 2, 3, 1, 2]); });
      it(`copyWithin with end`, () => { expect([1, 2, 3, 4, 5].copyWithin(0, 3, 4)).toEqual([4, 2, 3, 4, 5]); });
      it(`fill entire`, () => { expect(new Array(3).fill(7)).toEqual([7, 7, 7]); });
      it(`fill object same ref`, () => { const o = {}; const a = new Array(2).fill(o); expect(a[0]).toBe(a[1]); });
      it(`slug length fill`, () => { expect(new Array(sample.slug.length).fill(0).length).toBe(sample.slug.length); });
    });
  }
});
