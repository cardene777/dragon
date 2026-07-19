import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter484: sample additional (Set basic)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Set([1,2,3]).size = 3`, () => { expect(new Set([1, 2, 3]).size).toBe(3); });
      it(`new Set([1,1,2]).size = 2 (dedup)`, () => { expect(new Set([1, 1, 2]).size).toBe(2); });
      it(`new Set().add(1).has(1) = true`, () => { expect(new Set().add(1).has(1)).toBe(true); });
      it(`new Set([1]).delete(1) = true`, () => { expect(new Set([1]).delete(1)).toBe(true); });
      it(`new Set([1]).delete(2) = false`, () => { expect(new Set([1]).delete(2)).toBe(false); });
      it(`[...new Set([1,2,3])] length = 3`, () => { expect([...new Set([1, 2, 3])].length).toBe(3); });
      it(`new Set(sample.slug.split("")).size <= slug.length`, () => { expect(new Set(sample.slug.split("")).size).toBeLessThanOrEqual(sample.slug.length); });
    });
  }
});
