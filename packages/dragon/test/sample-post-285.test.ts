import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter286: sample additional (indexOf/lastIndexOf boundary)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug indexOf "" = 0`, () => { expect(sample.slug.indexOf("")).toBe(0); });
      it(`slug lastIndexOf "" = length`, () => { expect(sample.slug.lastIndexOf("")).toBe(sample.slug.length); });
      it(`label indexOf "" = 0`, () => { expect(sample.label.indexOf("")).toBe(0); });
      it(`label lastIndexOf "" = length`, () => { expect(sample.label.lastIndexOf("")).toBe(sample.label.length); });
      it(`slug indexOf self = 0`, () => { if (sample.slug.length) expect(sample.slug.indexOf(sample.slug)).toBe(0); });
      it(`slug lastIndexOf self = 0`, () => { if (sample.slug.length) expect(sample.slug.lastIndexOf(sample.slug)).toBe(0); });
      it(`slug indexOf with fromIndex > length = -1`, () => { expect(sample.slug.indexOf("x", 999)).toBe(-1); });
    });
  }
});
