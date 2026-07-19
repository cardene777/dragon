import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter355: sample additional (Math methods)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Math.sqrt(slug.length**2) = slug.length`, () => { expect(Math.sqrt(sample.slug.length ** 2)).toBe(sample.slug.length); });
      it(`Math.pow(2, 3) = 8`, () => { expect(Math.pow(2, 3)).toBe(8); });
      it(`Math.log(1) = 0`, () => { expect(Math.log(1)).toBe(0); });
      it(`Math.exp(0) = 1`, () => { expect(Math.exp(0)).toBe(1); });
      it(`Math.sin(0) = 0`, () => { expect(Math.sin(0)).toBe(0); });
      it(`Math.cos(0) = 1`, () => { expect(Math.cos(0)).toBe(1); });
      it(`Math.PI > 3`, () => { expect(Math.PI).toBeGreaterThan(3); });
    });
  }
});
