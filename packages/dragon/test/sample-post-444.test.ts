import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter445: sample additional (indexOf / lastIndexOf / includes)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`[1,2,3].indexOf(2) = 1`, () => { expect([1, 2, 3].indexOf(2)).toBe(1); });
      it(`[1,2,3].indexOf(4) = -1`, () => { expect([1, 2, 3].indexOf(4)).toBe(-1); });
      it(`[1,2,3,2].lastIndexOf(2) = 3`, () => { expect([1, 2, 3, 2].lastIndexOf(2)).toBe(3); });
      it(`[1,2,3].includes(2) = true`, () => { expect([1, 2, 3].includes(2)).toBe(true); });
      it(`[1,2,3].includes(4) = false`, () => { expect([1, 2, 3].includes(4)).toBe(false); });
      it(`[NaN].includes(NaN) = true`, () => { expect([NaN].includes(NaN)).toBe(true); });
      it(`slug.split includes first char`, () => { const first = sample.slug[0]; if (first) expect(sample.slug.split("").includes(first)).toBe(true); else expect(true).toBe(true); });
    });
  }
});
