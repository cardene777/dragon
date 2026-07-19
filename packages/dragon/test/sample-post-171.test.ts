import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter172: sample additional (chained ops)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug trim+lower length`, () => { expect(sample.slug.trim().toLowerCase().length).toBe(sample.slug.length); });
      it(`slug split+join eq`, () => { expect(sample.slug.split("").join("")).toBe(sample.slug); });
      it(`slug substring 0 = self`, () => { expect(sample.slug.substring(0, sample.slug.length)).toBe(sample.slug); });
      it(`slug slice 0 = self`, () => { expect(sample.slug.slice(0)).toBe(sample.slug); });
      it(`label trim+lower length`, () => { expect(sample.label.trim().toLowerCase().length).toBe(sample.label.length); });
      it(`label substring 0 = self`, () => { expect(sample.label.substring(0, sample.label.length)).toBe(sample.label); });
      it(`code substring 0 = self`, () => { expect(sample.code.substring(0, sample.code.length)).toBe(sample.code); });
    });
  }
});
