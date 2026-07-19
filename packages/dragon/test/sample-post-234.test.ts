import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter235: sample additional (String search/match)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug search nonexistent = -1`, () => { expect(sample.slug.search(/___NOTEXIST_ZXY___/)).toBe(-1); });
      it(`label search nonexistent = -1`, () => { expect(sample.label.search(/___NOTEXIST_ZXY___/)).toBe(-1); });
      it(`slug match nonexistent = null`, () => { expect(sample.slug.match(/___NOTEXIST_ZXY___/)).toBeNull(); });
      it(`label match nonexistent = null`, () => { expect(sample.label.match(/___NOTEXIST_ZXY___/)).toBeNull(); });
      it(`slug matchAll nonexistent = 0`, () => { expect([...sample.slug.matchAll(/___NOTEXIST_ZXY___/g)].length).toBe(0); });
      it(`slug search self >= 0`, () => { if (sample.slug.length) expect(sample.slug.search(sample.slug)).toBe(0); });
      it(`slug split with self = ["", ""]`, () => { if (sample.slug.length) expect(sample.slug.split(sample.slug)).toEqual(["", ""]); });
    });
  }
});
