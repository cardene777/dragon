import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter472: sample additional (Math sqrt / pow / cbrt / hypot)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Math.sqrt(16) = 4`, () => { expect(Math.sqrt(16)).toBe(4); });
      it(`Math.sqrt(0) = 0`, () => { expect(Math.sqrt(0)).toBe(0); });
      it(`Math.pow(2, 10) = 1024`, () => { expect(Math.pow(2, 10)).toBe(1024); });
      it(`2 ** 10 = 1024`, () => { expect(2 ** 10).toBe(1024); });
      it(`Math.cbrt(27) = 3`, () => { expect(Math.cbrt(27)).toBe(3); });
      it(`Math.hypot(3, 4) = 5`, () => { expect(Math.hypot(3, 4)).toBe(5); });
      it(`sqrt(slug.length ** 2) = slug.length`, () => { expect(Math.sqrt(sample.slug.length ** 2)).toBeCloseTo(sample.slug.length); });
    });
  }
});
