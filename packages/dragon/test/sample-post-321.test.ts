import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter322: sample additional (multi-arg concat)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug concat "", "" = slug`, () => { expect(sample.slug.concat("", "")).toBe(sample.slug); });
      it(`slug concat slug, slug = 3x length`, () => { expect(sample.slug.concat(sample.slug, sample.slug).length).toBe(sample.slug.length * 3); });
      it(`label concat "", "" = label`, () => { expect(sample.label.concat("", "")).toBe(sample.label); });
      it(`"" concat slug = slug`, () => { expect("".concat(sample.slug)).toBe(sample.slug); });
      it(`slug concat() = slug`, () => { expect(sample.slug.concat()).toBe(sample.slug); });
      it(`slug concat label starts with slug`, () => { expect(sample.slug.concat(sample.label).startsWith(sample.slug)).toBe(true); });
      it(`slug concat label ends with label`, () => { expect(sample.slug.concat(sample.label).endsWith(sample.label)).toBe(true); });
    });
  }
});
