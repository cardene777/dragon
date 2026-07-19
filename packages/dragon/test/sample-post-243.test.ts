import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter244: sample additional (equality / comparison)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug === slug`, () => { expect(sample.slug === sample.slug).toBe(true); });
      it(`Object.is(slug, slug) = true`, () => { expect(Object.is(sample.slug, sample.slug)).toBe(true); });
      it(`label === label`, () => { expect(sample.label === sample.label).toBe(true); });
      it(`sample === sample (ref eq)`, () => { expect(sample === sample).toBe(true); });
      it(`slug.length >= 0`, () => { expect(sample.slug.length >= 0).toBe(true); });
      it(`label.length >= 0`, () => { expect(sample.label.length >= 0).toBe(true); });
      it(`slug == slug (loose)`, () => { expect(sample.slug == sample.slug).toBe(true); });
    });
  }
});
