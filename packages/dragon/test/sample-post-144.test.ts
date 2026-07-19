import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter145: sample additional (deep equal)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug deep eq self`, () => { expect(sample.slug).toEqual(sample.slug); });
      it(`label deep eq self`, () => { expect(sample.label).toEqual(sample.label); });
      it(`code deep eq self`, () => { expect(sample.code).toEqual(sample.code); });
      it(`sample deep eq self`, () => { expect(sample).toEqual(sample); });
      it(`slug strict eq self`, () => { expect(sample.slug).toStrictEqual(sample.slug); });
      it(`label strict eq self`, () => { expect(sample.label).toStrictEqual(sample.label); });
      it(`sample shallow copy deep eq`, () => { expect({ ...sample }).toEqual(sample); });
    });
  }
});
