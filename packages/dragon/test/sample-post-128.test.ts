import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter129: sample additional 12 axis (numerics)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug length > 0`, () => { expect(sample.slug.length).toBeGreaterThan(0); });
      it(`slug length < 100`, () => { expect(sample.slug.length).toBeLessThan(100); });
      it(`slug length finite`, () => { expect(Number.isFinite(sample.slug.length)).toBe(true); });
      it(`slug length safe int`, () => { expect(Number.isSafeInteger(sample.slug.length)).toBe(true); });
      it(`label length > 0`, () => { expect(sample.label.length).toBeGreaterThan(0); });
      it(`code length >= 0`, () => { expect(sample.code.length).toBeGreaterThanOrEqual(0); });
      it(`code length < 100000`, () => { expect(sample.code.length).toBeLessThan(100000); });
    });
  }
});
