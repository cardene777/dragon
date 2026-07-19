import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter250: sample additional (Array slice boundary)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug slice(0) = slug`, () => { expect(sample.slug.slice(0)).toBe(sample.slug); });
      it(`slug slice() = slug`, () => { expect(sample.slug.slice()).toBe(sample.slug); });
      it(`slug slice(0, 0) = ""`, () => { expect(sample.slug.slice(0, 0)).toBe(""); });
      it(`slug slice(-0) = slug`, () => { expect(sample.slug.slice(-0)).toBe(sample.slug); });
      it(`slug slice(length) = ""`, () => { expect(sample.slug.slice(sample.slug.length)).toBe(""); });
      it(`slug slice(-length) = slug`, () => { expect(sample.slug.slice(-sample.slug.length)).toBe(sample.slug); });
      it(`label slice(0) = label`, () => { expect(sample.label.slice(0)).toBe(sample.label); });
    });
  }
});
