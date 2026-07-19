import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter436: sample additional (Array.reverse mutates)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`reverse returns self ref`, () => { const a = [1, 2, 3]; expect(a.reverse()).toBe(a); });
      it(`reverse mutates in place`, () => { const a = [1, 2, 3]; a.reverse(); expect(a).toEqual([3, 2, 1]); });
      it(`slug split reverse twice = original`, () => { const a = sample.slug.split(""); a.reverse().reverse(); expect(a).toEqual(sample.slug.split("")); });
      it(`sort returns self ref`, () => { const a = [3, 1, 2]; expect(a.sort()).toBe(a); });
      it(`sort mutates in place`, () => { const a = [3, 1, 2]; a.sort(); expect(a).toEqual([1, 2, 3]); });
      it(`splice returns removed`, () => { const a = [1, 2, 3, 4]; expect(a.splice(1, 2)).toEqual([2, 3]); expect(a).toEqual([1, 4]); });
      it(`fill returns self ref`, () => { const a = [1, 2, 3]; expect(a.fill(0)).toBe(a); });
    });
  }
});
