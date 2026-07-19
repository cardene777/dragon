import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter199: sample additional (concatenation)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug concat slug x2`, () => { expect(sample.slug.concat(sample.slug).length).toBe(sample.slug.length * 2); });
      it(`slug + slug x2`, () => { expect((sample.slug + sample.slug).length).toBe(sample.slug.length * 2); });
      it(`label concat label x2`, () => { expect(sample.label.concat(sample.label).length).toBe(sample.label.length * 2); });
      it(`slug concat empty = slug`, () => { expect(sample.slug.concat("")).toBe(sample.slug); });
      it(`label concat empty = label`, () => { expect(sample.label.concat("")).toBe(sample.label); });
      it(`"" concat slug = slug`, () => { expect("".concat(sample.slug)).toBe(sample.slug); });
      it(`"" concat label = label`, () => { expect("".concat(sample.label)).toBe(sample.label); });
    });
  }
});
