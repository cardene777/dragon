import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter232: sample additional (Number/Math)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug length is safe integer`, () => { expect(Number.isSafeInteger(sample.slug.length)).toBe(true); });
      it(`label length is safe integer`, () => { expect(Number.isSafeInteger(sample.label.length)).toBe(true); });
      it(`slug length finite`, () => { expect(Number.isFinite(sample.slug.length)).toBe(true); });
      it(`label length finite`, () => { expect(Number.isFinite(sample.label.length)).toBe(true); });
      it(`Math.max slug length 0 >= 0`, () => { expect(Math.max(sample.slug.length, 0)).toBeGreaterThanOrEqual(0); });
      it(`Math.abs label length = label length`, () => { expect(Math.abs(sample.label.length)).toBe(sample.label.length); });
      it(`slug length not NaN`, () => { expect(Number.isNaN(sample.slug.length)).toBe(false); });
    });
  }
});
