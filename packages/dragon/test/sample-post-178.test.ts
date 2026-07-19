import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter179: sample additional (existential/hasOwn)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Object.hasOwn slug`, () => { expect(Object.hasOwn(sample as object, "slug")).toBe(true); });
      it(`Object.hasOwn label`, () => { expect(Object.hasOwn(sample as object, "label")).toBe(true); });
      it(`Object.hasOwn code`, () => { expect(Object.hasOwn(sample as object, "code")).toBe(true); });
      it(`Object.hasOwn xxx not`, () => { expect(Object.hasOwn(sample as object, "__xxx__")).toBe(false); });
      it(`slug propertyIsEnumerable`, () => { expect(Object.prototype.propertyIsEnumerable.call(sample, "slug")).toBe(true); });
      it(`label propertyIsEnumerable`, () => { expect(Object.prototype.propertyIsEnumerable.call(sample, "label")).toBe(true); });
      it(`code propertyIsEnumerable`, () => { expect(Object.prototype.propertyIsEnumerable.call(sample, "code")).toBe(true); });
    });
  }
});
