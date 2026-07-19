import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter310: sample additional (RegExp basics)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`/./ test slug truthy if nonempty`, () => { if (sample.slug.length) expect(/./.test(sample.slug)).toBe(true); });
      it(`/./ test label truthy if nonempty`, () => { if (sample.label.length) expect(/./.test(sample.label)).toBe(true); });
      it(`/___NOTEXIST___/ test slug false`, () => { expect(/___NOTEXIST___/.test(sample.slug)).toBe(false); });
      it(`/___NOTEXIST___/ test label false`, () => { expect(/___NOTEXIST___/.test(sample.label)).toBe(false); });
      it(`/.*/  test slug true`, () => { expect(/.*/.test(sample.slug)).toBe(true); });
      it(`new RegExp("") test slug = true`, () => { expect(new RegExp("").test(sample.slug)).toBe(true); });
      it(`/./ instanceof RegExp`, () => { expect(/./ instanceof RegExp).toBe(true); });
    });
  }
});
