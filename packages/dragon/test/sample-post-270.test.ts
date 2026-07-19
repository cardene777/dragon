import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter271: sample additional (Object.create / prototype)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Object.create(s).__proto__ = s`, () => { expect(Object.getPrototypeOf(Object.create(sample))).toBe(sample); });
      it(`sample proto = Object.prototype`, () => { expect(Object.getPrototypeOf(sample)).toBe(Object.prototype); });
      it(`Object.create(s) has slug via proto`, () => { expect((Object.create(sample) as typeof sample).slug).toBe(sample.slug); });
      it(`Object.create(s) has label via proto`, () => { expect((Object.create(sample) as typeof sample).label).toBe(sample.label); });
      it(`slug proto = String.prototype`, () => { expect(Object.getPrototypeOf(Object(sample.slug))).toBe(String.prototype); });
      it(`label proto = String.prototype`, () => { expect(Object.getPrototypeOf(Object(sample.label))).toBe(String.prototype); });
      it(`Object.create(null) proto = null`, () => { expect(Object.getPrototypeOf(Object.create(null))).toBeNull(); });
    });
  }
});
