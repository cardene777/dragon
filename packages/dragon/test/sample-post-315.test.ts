import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter316: sample additional (Number constants)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Number.EPSILON > 0`, () => { expect(Number.EPSILON).toBeGreaterThan(0); });
      it(`Number.MAX_VALUE > 0`, () => { expect(Number.MAX_VALUE).toBeGreaterThan(0); });
      it(`Number.MIN_VALUE > 0`, () => { expect(Number.MIN_VALUE).toBeGreaterThan(0); });
      it(`Number.MAX_SAFE_INTEGER > slug.length`, () => { expect(Number.MAX_SAFE_INTEGER).toBeGreaterThan(sample.slug.length); });
      it(`Number.NaN != Number.NaN`, () => { expect(Number.NaN === Number.NaN).toBe(false); });
      it(`Number.POSITIVE_INFINITY > label.length`, () => { expect(Number.POSITIVE_INFINITY).toBeGreaterThan(sample.label.length); });
      it(`Number.NEGATIVE_INFINITY < 0`, () => { expect(Number.NEGATIVE_INFINITY).toBeLessThan(0); });
    });
  }
});
