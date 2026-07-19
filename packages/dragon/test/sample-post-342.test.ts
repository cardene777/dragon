import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter343: sample additional (bitwise ops)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug.length & 0 = 0`, () => { expect(sample.slug.length & 0).toBe(0); });
      it(`slug.length | 0 = slug.length`, () => { expect(sample.slug.length | 0).toBe(sample.slug.length); });
      it(`label.length | 0 = label.length`, () => { expect(sample.label.length | 0).toBe(sample.label.length); });
      it(`slug.length ^ slug.length = 0`, () => { expect(sample.slug.length ^ sample.slug.length).toBe(0); });
      it(`~~slug.length = slug.length`, () => { expect(~~sample.slug.length).toBe(sample.slug.length); });
      it(`slug.length << 0 = slug.length`, () => { expect(sample.slug.length << 0).toBe(sample.slug.length); });
      it(`slug.length >> 0 = slug.length`, () => { expect(sample.slug.length >> 0).toBe(sample.slug.length); });
    });
  }
});
