import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter451: sample additional (reduce / reduceRight)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`[1,2,3].reduce((a,b) => a+b, 0) = 6`, () => { expect([1, 2, 3].reduce((a, b) => a + b, 0)).toBe(6); });
      it(`[].reduce((a,b) => a+b, 0) = 0`, () => { expect([].reduce((a: number, b: number) => a + b, 0)).toBe(0); });
      it(`[1,2,3].reduce((a,b) => a+b) = 6`, () => { expect([1, 2, 3].reduce((a, b) => a + b)).toBe(6); });
      it(`[1,2,3].reduceRight((a,b) => a-b) = 0`, () => { expect([1, 2, 3].reduceRight((a, b) => a - b)).toBe(0); });
      it(`[].reduce throws without init`, () => { expect(() => [].reduce((a: number, b: number) => a + b)).toThrow(TypeError); });
      it(`reduce sum = loop sum`, () => { const a = [1, 2, 3, 4, 5]; let s = 0; for (const v of a) s += v; expect(a.reduce((x, y) => x + y, 0)).toBe(s); });
      it(`slug.split reduce concat = slug`, () => { expect(sample.slug.split("").reduce((a, b) => a + b, "")).toBe(sample.slug); });
    });
  }
});
