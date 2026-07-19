import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter352: sample additional (Number parse)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`parseInt(slug.length.toString()) = slug.length`, () => { expect(parseInt(String(sample.slug.length))).toBe(sample.slug.length); });
      it(`parseInt(label.length.toString()) = label.length`, () => { expect(parseInt(String(sample.label.length))).toBe(sample.label.length); });
      it(`parseFloat("3.14") = 3.14`, () => { expect(parseFloat("3.14")).toBe(3.14); });
      it(`Number("42") = 42`, () => { expect(Number("42")).toBe(42); });
      it(`parseInt("42.5") = 42`, () => { expect(parseInt("42.5")).toBe(42); });
      it(`parseInt("ff", 16) = 255`, () => { expect(parseInt("ff", 16)).toBe(255); });
      it(`parseInt("42abc") = 42`, () => { expect(parseInt("42abc")).toBe(42); });
    });
  }
});
