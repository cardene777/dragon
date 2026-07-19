import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter361: sample additional (String.repeat)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug.repeat(0) = ""`, () => { expect(sample.slug.repeat(0)).toBe(""); });
      it(`slug.repeat(1) = slug`, () => { expect(sample.slug.repeat(1)).toBe(sample.slug); });
      it(`slug.repeat(2) length = 2x`, () => { expect(sample.slug.repeat(2).length).toBe(sample.slug.length * 2); });
      it(`label.repeat(0) = ""`, () => { expect(sample.label.repeat(0)).toBe(""); });
      it(`label.repeat(1) = label`, () => { expect(sample.label.repeat(1)).toBe(sample.label); });
      it(`slug.repeat(3) starts/ends with slug`, () => { const r = sample.slug.repeat(3); expect(r.startsWith(sample.slug)).toBe(true); expect(r.endsWith(sample.slug)).toBe(true); });
      it(`slug.padStart(slug.length, "x") = slug`, () => { expect(sample.slug.padStart(sample.slug.length, "x")).toBe(sample.slug); });
    });
  }
});
