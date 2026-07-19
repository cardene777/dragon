import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter367: sample additional (Array method chain fluent)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split map filter = slug arr`, () => { expect(sample.slug.split("").map(c => c).filter(() => true)).toEqual(sample.slug.split("")); });
      it(`slug split reverse reverse = slug arr`, () => { expect(sample.slug.split("").reverse().reverse()).toEqual(sample.slug.split("")); });
      it(`slug split sort length preserved`, () => { expect(sample.slug.split("").sort().length).toBe(sample.slug.length); });
      it(`slug split concat [] length preserved`, () => { expect(sample.slug.split("").concat([]).length).toBe(sample.slug.length); });
      it(`slug split flat length preserved`, () => { expect(sample.slug.split("").flat().length).toBe(sample.slug.length); });
      it(`slug split flatMap identity = slug arr`, () => { expect(sample.slug.split("").flatMap(x => [x])).toEqual(sample.slug.split("")); });
      it(`label split map identity = label arr`, () => { expect(sample.label.split("").map(x => x)).toEqual(sample.label.split("")); });
    });
  }
});
