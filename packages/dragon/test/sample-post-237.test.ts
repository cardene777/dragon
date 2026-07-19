import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter238: sample additional (Boolean coercion)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Boolean(sample) = true`, () => { expect(Boolean(sample)).toBe(true); });
      it(`!!sample = true`, () => { expect(!!sample).toBe(true); });
      it(`Boolean(slug) truthy if nonempty`, () => { if (sample.slug.length) expect(Boolean(sample.slug)).toBe(true); });
      it(`Boolean(label) truthy if nonempty`, () => { if (sample.label.length) expect(Boolean(sample.label)).toBe(true); });
      it(`String(slug) = slug`, () => { expect(String(sample.slug)).toBe(sample.slug); });
      it(`String(label) = label`, () => { expect(String(sample.label)).toBe(sample.label); });
      it(`Number(String(slug length)) = slug length`, () => { expect(Number(String(sample.slug.length))).toBe(sample.slug.length); });
    });
  }
});
