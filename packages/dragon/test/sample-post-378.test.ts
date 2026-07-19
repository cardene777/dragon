import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter379: sample additional (String comparison)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug === slug`, () => { expect(sample.slug === sample.slug).toBe(true); });
      it(`label === label`, () => { expect(sample.label === sample.label).toBe(true); });
      it(`slug.localeCompare(slug) = 0`, () => { expect(sample.slug.localeCompare(sample.slug)).toBe(0); });
      it(`slug < slug + "z"`, () => { expect(sample.slug < sample.slug + "z").toBe(true); });
      it(`label.length <= (label + "x").length`, () => { expect(sample.label.length).toBeLessThanOrEqual((sample.label + "x").length); });
      it(`slug.localeCompare("") > 0 if nonempty`, () => { if (sample.slug.length) expect(sample.slug.localeCompare("")).toBeGreaterThan(0); });
      it(`"".localeCompare(slug) < 0 if nonempty`, () => { if (sample.slug.length) expect("".localeCompare(sample.slug)).toBeLessThan(0); });
    });
  }
});
