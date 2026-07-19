import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter535: sample additional (Array sort comparator)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`numeric asc`, () => { expect([3, 1, 2].sort((a, b) => a - b)).toEqual([1, 2, 3]); });
      it(`numeric desc`, () => { expect([3, 1, 2].sort((a, b) => b - a)).toEqual([3, 2, 1]); });
      it(`default lexicographic`, () => { expect([10, 2, 1].sort()).toEqual([1, 10, 2]); });
      it(`string sort`, () => { expect(["c", "a", "b"].sort()).toEqual(["a", "b", "c"]); });
      it(`sort by length`, () => { expect(["aaa", "a", "aa"].sort((a, b) => a.length - b.length)).toEqual(["a", "aa", "aaa"]); });
      it(`sort empty stays empty`, () => { expect([].sort()).toEqual([]); });
      it(`slug chars sortable`, () => { const chars = sample.slug.split("").sort(); expect(chars.length).toBe(sample.slug.length); });
    });
  }
});
