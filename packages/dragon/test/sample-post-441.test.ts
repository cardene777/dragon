import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter442: sample additional (Array.of / Array.from iterable)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Array.of(1,2,3) = [1,2,3]`, () => { expect(Array.of(1, 2, 3)).toEqual([1, 2, 3]); });
      it(`Array.of() = []`, () => { expect(Array.of()).toEqual([]); });
      it(`Array.of(7).length = 1`, () => { expect(Array.of(7).length).toBe(1); });
      it(`Array.from(new Set([1,1,2])) = [1,2]`, () => { expect(Array.from(new Set([1, 1, 2]))).toEqual([1, 2]); });
      it(`Array.from({length:3}) length = 3`, () => { expect(Array.from({ length: 3 }).length).toBe(3); });
      it(`Array.from({length:3}, (_,i) => i) = [0,1,2]`, () => { expect(Array.from({ length: 3 }, (_, i) => i)).toEqual([0, 1, 2]); });
      it(`slug -> Array.from length preserved`, () => { expect(Array.from(sample.slug).length).toBe(sample.slug.length); });
    });
  }
});
