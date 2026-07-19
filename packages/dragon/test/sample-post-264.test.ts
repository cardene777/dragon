import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter265: sample additional (Object property descriptor)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`getOwnPropertyDescriptor(slug) not undefined`, () => { expect(Object.getOwnPropertyDescriptor(sample, "slug")).not.toBeUndefined(); });
      it(`getOwnPropertyDescriptor(label) not undefined`, () => { expect(Object.getOwnPropertyDescriptor(sample, "label")).not.toBeUndefined(); });
      it(`getOwnPropertyDescriptor(nonexist) undefined`, () => { expect(Object.getOwnPropertyDescriptor(sample, "___NOTEXIST___")).toBeUndefined(); });
      it(`getOwnPropertyNames contains slug`, () => { expect(Object.getOwnPropertyNames(sample)).toContain("slug"); });
      it(`getOwnPropertyNames contains label`, () => { expect(Object.getOwnPropertyNames(sample)).toContain("label"); });
      it(`getOwnPropertyNames length >= 2`, () => { expect(Object.getOwnPropertyNames(sample).length).toBeGreaterThanOrEqual(2); });
      it(`getOwnPropertyDescriptors returns object`, () => { expect(typeof Object.getOwnPropertyDescriptors(sample)).toBe("object"); });
    });
  }
});
