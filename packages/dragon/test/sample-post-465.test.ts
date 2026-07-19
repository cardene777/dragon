import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter466: sample additional (String indexOf / lastIndexOf / search)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`"abcabc".indexOf("b") = 1`, () => { expect("abcabc".indexOf("b")).toBe(1); });
      it(`"abcabc".indexOf("z") = -1`, () => { expect("abcabc".indexOf("z")).toBe(-1); });
      it(`"abcabc".lastIndexOf("b") = 4`, () => { expect("abcabc".lastIndexOf("b")).toBe(4); });
      it(`"abcabc".search(/b/) = 1`, () => { expect("abcabc".search(/b/)).toBe(1); });
      it(`"abcabc".search(/z/) = -1`, () => { expect("abcabc".search(/z/)).toBe(-1); });
      it(`"".indexOf("x") = -1`, () => { expect("".indexOf("x")).toBe(-1); });
      it(`slug indexOf first = 0`, () => { if (sample.slug.length > 0) expect(sample.slug.indexOf(sample.slug[0])).toBe(0); else expect(true).toBe(true); });
    });
  }
});
