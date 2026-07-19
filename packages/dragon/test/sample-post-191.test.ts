import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter192: sample additional (Math/Number)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug length Math.floor identity`, () => { expect(Math.floor(sample.slug.length)).toBe(sample.slug.length); });
      it(`label length Math.floor identity`, () => { expect(Math.floor(sample.label.length)).toBe(sample.label.length); });
      it(`code length Math.floor identity`, () => { expect(Math.floor(sample.code.length)).toBe(sample.code.length); });
      it(`slug length parseInt = length`, () => { expect(parseInt(String(sample.slug.length), 10)).toBe(sample.slug.length); });
      it(`label length parseInt = length`, () => { expect(parseInt(String(sample.label.length), 10)).toBe(sample.label.length); });
      it(`slug length Number cast = length`, () => { expect(Number(sample.slug.length)).toBe(sample.slug.length); });
      it(`slug length Math.abs identity`, () => { expect(Math.abs(sample.slug.length)).toBe(sample.slug.length); });
    });
  }
});
