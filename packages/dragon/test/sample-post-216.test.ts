import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter217: sample additional (reduce/reduceRight)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split reduce count = length`, () => { expect(sample.slug.split("").reduce((a) => a + 1, 0)).toBe(sample.slug.length); });
      it(`slug split reduceRight count = length`, () => { expect(sample.slug.split("").reduceRight((a) => a + 1, 0)).toBe(sample.slug.length); });
      it(`label split reduce count = length`, () => { expect(sample.label.split("").reduce((a) => a + 1, 0)).toBe(sample.label.length); });
      it(`label split reduceRight count = length`, () => { expect(sample.label.split("").reduceRight((a) => a + 1, 0)).toBe(sample.label.length); });
      it(`slug split reduce concat = slug`, () => { expect(sample.slug.split("").reduce((a, c) => a + c, "")).toBe(sample.slug); });
      it(`label split reduce concat = label`, () => { expect(sample.label.split("").reduce((a, c) => a + c, "")).toBe(sample.label); });
      it(`slug split reduceRight concat = reverse slug`, () => { expect(sample.slug.split("").reduceRight((a, c) => a + c, "")).toBe(sample.slug.split("").reverse().join("")); });
    });
  }
});
