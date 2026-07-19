import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter280: sample additional (Object.prototype methods)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Object.hasOwn(s, "slug") = true`, () => { expect(Object.hasOwn(sample, "slug")).toBe(true); });
      it(`Object.hasOwn(s, "label") = true`, () => { expect(Object.hasOwn(sample, "label")).toBe(true); });
      it(`Object.hasOwn(s, "nonexist") = false`, () => { expect(Object.hasOwn(sample, "___NOTEXIST___")).toBe(false); });
      it(`Object.prototype.isPrototypeOf(s) = true`, () => { expect(Object.prototype.isPrototypeOf.call(Object.prototype, sample)).toBe(true); });
      it(`s.toString() is string`, () => { expect(typeof sample.toString()).toBe("string"); });
      it(`s.valueOf() = s`, () => { expect(sample.valueOf()).toBe(sample); });
      it(`s propertyIsEnumerable slug = true`, () => { expect(Object.prototype.propertyIsEnumerable.call(sample, "slug")).toBe(true); });
    });
  }
});
