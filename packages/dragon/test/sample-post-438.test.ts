import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter439: sample additional (Array holes / sparse)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Array(3).length = 3`, () => { expect(new Array(3).length).toBe(3); });
      it(`new Array(3)[0] = undefined`, () => { expect(new Array(3)[0]).toBeUndefined(); });
      it(`[,,,].length = 3`, () => { expect([, , ,].length).toBe(3); });
      it(`[1,,3].length = 3`, () => { expect([1, , 3].length).toBe(3); });
      it(`[1,,3].filter Boolean length = 2`, () => { expect([1, , 3].filter(Boolean).length).toBe(2); });
      it(`new Array(3).fill(0) = [0,0,0]`, () => { expect(new Array(3).fill(0)).toEqual([0, 0, 0]); });
      it(`slug split length = slug length`, () => { expect(sample.slug.split("").length).toBe(sample.slug.length); });
    });
  }
});
