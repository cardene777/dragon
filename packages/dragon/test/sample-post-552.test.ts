import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter553: sample additional (Array flat deep / isArray edge)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`flat depth 0 = shallow copy`, () => { expect([1, [2]].flat(0)).toEqual([1, [2]]); });
      it(`flat depth 2`, () => { expect([1, [2, [3, [4]]]].flat(2)).toEqual([1, 2, 3, [4]]); });
      it(`flat removes empty slots`, () => { expect([1, , 3].flat()).toEqual([1, 3]); });
      it(`Array.isArray(new Array()) = true`, () => { expect(Array.isArray(new Array())).toBe(true); });
      it(`Array.isArray("abc") = false`, () => { expect(Array.isArray("abc")).toBe(false); });
      it(`Array.isArray({length:0}) = false`, () => { expect(Array.isArray({ length: 0 })).toBe(false); });
      it(`Array.isArray(slug.split) = true`, () => { expect(Array.isArray(sample.slug.split(""))).toBe(true); });
    });
  }
});
