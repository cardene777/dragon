import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter259: sample additional (charCode/codePoint)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug charCodeAt(0) is number`, () => { if (sample.slug.length) expect(typeof sample.slug.charCodeAt(0)).toBe("number"); });
      it(`slug codePointAt(0) is number`, () => { if (sample.slug.length) expect(typeof sample.slug.codePointAt(0)).toBe("number"); });
      it(`label charAt(0) is string`, () => { expect(typeof sample.label.charAt(0)).toBe("string"); });
      it(`slug charCodeAt(-1) is NaN`, () => { expect(Number.isNaN(sample.slug.charCodeAt(-1))).toBe(true); });
      it(`slug codePointAt(-1) is undefined`, () => { expect(sample.slug.codePointAt(-1)).toBeUndefined(); });
      it(`slug charAt(length) = ""`, () => { expect(sample.slug.charAt(sample.slug.length)).toBe(""); });
      it(`label charAt(length) = ""`, () => { expect(sample.label.charAt(sample.label.length)).toBe(""); });
    });
  }
});
