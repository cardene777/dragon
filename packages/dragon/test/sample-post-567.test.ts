import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter568: sample additional (Array slice negative edge)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slice(-2) last two`, () => { expect([1, 2, 3, 4].slice(-2)).toEqual([3, 4]); });
      it(`slice(1, -1) middle`, () => { expect([1, 2, 3, 4].slice(1, -1)).toEqual([2, 3]); });
      it(`slice(-3, -1)`, () => { expect([1, 2, 3, 4].slice(-3, -1)).toEqual([2, 3]); });
      it(`slice out of range = empty`, () => { expect([1, 2].slice(5)).toEqual([]); });
      it(`slice(0, 0) = empty`, () => { expect([1, 2].slice(0, 0)).toEqual([]); });
      it(`at(-2) works`, () => { expect([1, 2, 3].at(-2)).toBe(2); });
      it(`slug slice(-1) last char`, () => { const r = sample.slug.slice(-1); if (sample.slug.length > 0) expect(r).toBe(sample.slug[sample.slug.length - 1]); else expect(r).toBe(""); });
    });
  }
});
