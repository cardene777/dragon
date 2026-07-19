import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter185: sample additional (frozen/sealed check)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`not frozen`, () => { expect(Object.isFrozen(sample)).toBe(false); });
      it(`not sealed`, () => { expect(Object.isSealed(sample)).toBe(false); });
      it(`is extensible`, () => { expect(Object.isExtensible(sample)).toBe(true); });
      it(`slug descriptor exists`, () => { expect(Object.getOwnPropertyDescriptor(sample, "slug")).toBeDefined(); });
      it(`slug enumerable`, () => { expect(Object.getOwnPropertyDescriptor(sample, "slug")?.enumerable).toBe(true); });
      it(`label descriptor exists`, () => { expect(Object.getOwnPropertyDescriptor(sample, "label")).toBeDefined(); });
      it(`code descriptor exists`, () => { expect(Object.getOwnPropertyDescriptor(sample, "code")).toBeDefined(); });
    });
  }
});
