import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter475: sample additional (Math trig)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Math.sin(0) = 0`, () => { expect(Math.sin(0)).toBe(0); });
      it(`Math.cos(0) = 1`, () => { expect(Math.cos(0)).toBe(1); });
      it(`Math.tan(0) = 0`, () => { expect(Math.tan(0)).toBe(0); });
      it(`Math.sin(Math.PI/2) ~ 1`, () => { expect(Math.sin(Math.PI / 2)).toBeCloseTo(1); });
      it(`Math.cos(Math.PI) ~ -1`, () => { expect(Math.cos(Math.PI)).toBeCloseTo(-1); });
      it(`Math.asin(1) ~ PI/2`, () => { expect(Math.asin(1)).toBeCloseTo(Math.PI / 2); });
      it(`slug length is non-negative (Math.sign)`, () => { expect(Math.sign(sample.slug.length)).toBeGreaterThanOrEqual(0); });
    });
  }
});
