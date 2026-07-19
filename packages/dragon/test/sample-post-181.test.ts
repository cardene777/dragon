import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter182: sample additional (String search method)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug indexOf self = 0`, () => { expect(sample.slug.indexOf(sample.slug)).toBe(0); });
      it(`slug lastIndexOf self = 0`, () => { expect(sample.slug.lastIndexOf(sample.slug)).toBe(0); });
      it(`slug indexOf ""`, () => { expect(sample.slug.indexOf("")).toBe(0); });
      it(`slug lastIndexOf ""`, () => { expect(sample.slug.lastIndexOf("")).toBe(sample.slug.length); });
      it(`label indexOf self = 0`, () => { expect(sample.label.indexOf(sample.label)).toBe(0); });
      it(`label lastIndexOf self = 0`, () => { expect(sample.label.lastIndexOf(sample.label)).toBe(0); });
      it(`code indexOf ""`, () => { expect(sample.code.indexOf("")).toBe(0); });
    });
  }
});
