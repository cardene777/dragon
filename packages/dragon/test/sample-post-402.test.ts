import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter403: sample additional (structuredClone)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`structuredClone(sample).slug = slug`, () => { expect(structuredClone(sample).slug).toBe(sample.slug); });
      it(`structuredClone(sample).label = label`, () => { expect(structuredClone(sample).label).toBe(sample.label); });
      it(`structuredClone(sample) deep equal`, () => { expect(structuredClone(sample)).toEqual(sample); });
      it(`structuredClone(sample) not = sample ref`, () => { expect(structuredClone(sample)).not.toBe(sample); });
      it(`structuredClone(slug) = slug`, () => { expect(structuredClone(sample.slug)).toBe(sample.slug); });
      it(`structuredClone(label) = label`, () => { expect(structuredClone(sample.label)).toBe(sample.label); });
      it(`structuredClone([1,2,3]) = [1,2,3]`, () => { expect(structuredClone([1, 2, 3])).toEqual([1, 2, 3]); });
    });
  }
});
