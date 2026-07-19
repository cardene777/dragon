import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter346: sample additional (spread in function call)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Math.max(...[1,2,3]) = 3`, () => { expect(Math.max(...[1, 2, 3])).toBe(3); });
      it(`Math.min(...[1,2,3]) = 1`, () => { expect(Math.min(...[1, 2, 3])).toBe(1); });
      it(`[...slug].length = slug.length`, () => { expect([...sample.slug].length).toBe(sample.slug.length); });
      it(`[...label].length = label.length`, () => { expect([...sample.label].length).toBe(sample.label.length); });
      it(`rest fn returns args`, () => { const f = (...args: string[]) => args; expect(f("a", "b", "c")).toEqual(["a", "b", "c"]); });
      it(`fn(...slug.split(""))`, () => { const f = (...args: string[]) => args.length; expect(f(...sample.slug.split(""))).toBe(sample.slug.length); });
      it(`[1,...[2,3],4] = [1,2,3,4]`, () => { expect([1, ...[2, 3], 4]).toEqual([1, 2, 3, 4]); });
    });
  }
});
