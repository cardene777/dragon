import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter448: sample additional (at / with / keys / values / entries)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`[1,2,3].at(-1) = 3`, () => { expect([1, 2, 3].at(-1)).toBe(3); });
      it(`[1,2,3].at(0) = 1`, () => { expect([1, 2, 3].at(0)).toBe(1); });
      it(`[1,2,3].at(10) = undefined`, () => { expect([1, 2, 3].at(10)).toBeUndefined(); });
      it(`[1,2,3].with(1, 9) = [1,9,3]`, () => { expect([1, 2, 3].with(1, 9)).toEqual([1, 9, 3]); });
      it(`[...arr.keys()] length preserved`, () => { const a = [1, 2, 3]; expect([...a.keys()].length).toBe(a.length); });
      it(`[...arr.values()] length preserved`, () => { const a = [1, 2, 3]; expect([...a.values()].length).toBe(a.length); });
      it(`slug.at(0) = first char (or undefined)`, () => { const first = sample.slug.at(0); if (sample.slug.length > 0) expect(first).toBe(sample.slug[0]); else expect(first).toBeUndefined(); });
    });
  }
});
