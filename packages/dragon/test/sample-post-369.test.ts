import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter370: sample additional (Array reduce accumulator)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split reduce with 0 initial = length`, () => { expect(sample.slug.split("").reduce((a) => a + 1, 0)).toBe(sample.slug.length); });
      it(`label split reduce with 0 initial = length`, () => { expect(sample.label.split("").reduce((a) => a + 1, 0)).toBe(sample.label.length); });
      it(`slug split reduce with {} initial = obj`, () => { expect(typeof sample.slug.split("").reduce((a) => a, {})).toBe("object"); });
      it(`slug split reduce with 100 initial = 100 + length`, () => { expect(sample.slug.split("").reduce((a) => a + 1, 100)).toBe(100 + sample.slug.length); });
      it(`slug split reduce concat "" = slug`, () => { expect(sample.slug.split("").reduce((a, c) => a + c, "")).toBe(sample.slug); });
      it(`slug split reduceRight concat "" = reversed`, () => { expect(sample.slug.split("").reduceRight((a, c) => a + c, "")).toBe(sample.slug.split("").reverse().join("")); });
      it(`[].reduce with 5 initial = 5`, () => { expect(([] as number[]).reduce((a) => a + 1, 5)).toBe(5); });
    });
  }
});
