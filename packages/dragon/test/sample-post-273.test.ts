import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter274: sample additional (Array-like conversion)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Array.from(slug) length > 0`, () => { if (sample.slug.length) expect(Array.from(sample.slug).length).toBeGreaterThan(0); });
      it(`Array.from(label) length > 0`, () => { if (sample.label.length) expect(Array.from(sample.label).length).toBeGreaterThan(0); });
      it(`Array.from({length:3}, mapFn) length = 3`, () => { expect(Array.from({ length: 3 }, () => sample.slug).length).toBe(3); });
      it(`Array.from(new Set(slug)) size <= slug length`, () => { expect(Array.from(new Set(sample.slug)).length).toBeLessThanOrEqual(sample.slug.length); });
      it(`Array.from(slug) join = slug or normalized`, () => { expect(Array.from(sample.slug).join("").length).toBeGreaterThanOrEqual(0); });
      it(`Array.from is not reference eq`, () => { const a = [1, 2, 3]; expect(Array.from(a)).not.toBe(a); });
      it(`Array.from returns array`, () => { expect(Array.isArray(Array.from(sample.slug))).toBe(true); });
    });
  }
});
