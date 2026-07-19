import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter175: sample additional (encoded)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug encodeURI ok`, () => { expect(() => encodeURI(sample.slug)).not.toThrow(); });
      it(`slug encodeURIComponent ok`, () => { expect(() => encodeURIComponent(sample.slug)).not.toThrow(); });
      it(`slug decodeURI round-trip`, () => { expect(decodeURI(encodeURI(sample.slug))).toBe(sample.slug); });
      it(`slug decodeURIComponent round-trip`, () => { expect(decodeURIComponent(encodeURIComponent(sample.slug))).toBe(sample.slug); });
      it(`label encodeURI ok`, () => { expect(() => encodeURI(sample.label)).not.toThrow(); });
      it(`label decodeURI round-trip`, () => { expect(decodeURI(encodeURI(sample.label))).toBe(sample.label); });
      it(`code encodeURIComponent no throw`, () => { expect(() => encodeURIComponent(sample.code)).not.toThrow(); });
    });
  }
});
