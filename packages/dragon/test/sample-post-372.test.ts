import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter373: sample additional (Array.with ES2023)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`[1,2,3].with(0, 9) = [9,2,3]`, () => { expect([1, 2, 3].with(0, 9)).toEqual([9, 2, 3]); });
      it(`[1,2,3].with(-1, 9) = [1,2,9]`, () => { expect([1, 2, 3].with(-1, 9)).toEqual([1, 2, 9]); });
      it(`slug split with(0, "X") first char = X`, () => { if (sample.slug.length) expect(sample.slug.split("").with(0, "X")[0]).toBe("X"); });
      it(`slug split with does not mutate`, () => { const a = sample.slug.split(""); a.with(0, "X"); expect(a).toEqual(sample.slug.split("")); });
      it(`label split with(-1, "X") last char = X`, () => { if (sample.label.length) expect(sample.label.split("").with(-1, "X").at(-1)).toBe("X"); });
      it(`[1,2,3].with is not = original`, () => { const a = [1, 2, 3]; expect(a.with(0, 9)).not.toBe(a); });
      it(`slug split with returns new array`, () => { const a = sample.slug.split(""); expect(a.with(0, "X")).not.toBe(a); });
    });
  }
});
