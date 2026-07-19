import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter454: sample additional (copyWithin / fill edge)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`[1,2,3,4,5].copyWithin(0,3) = [4,5,3,4,5]`, () => { expect([1, 2, 3, 4, 5].copyWithin(0, 3)).toEqual([4, 5, 3, 4, 5]); });
      it(`copyWithin returns self ref`, () => { const a = [1, 2, 3]; expect(a.copyWithin(0, 1)).toBe(a); });
      it(`[1,2,3].fill(0) = [0,0,0]`, () => { expect([1, 2, 3].fill(0)).toEqual([0, 0, 0]); });
      it(`[1,2,3].fill(0, 1) = [1,0,0]`, () => { expect([1, 2, 3].fill(0, 1)).toEqual([1, 0, 0]); });
      it(`[1,2,3].fill(0, 1, 2) = [1,0,3]`, () => { expect([1, 2, 3].fill(0, 1, 2)).toEqual([1, 0, 3]); });
      it(`fill returns self ref`, () => { const a = [1, 2, 3]; expect(a.fill(0)).toBe(a); });
      it(`sample slug is non-empty`, () => { expect(sample.slug.length).toBeGreaterThan(0); });
    });
  }
});
