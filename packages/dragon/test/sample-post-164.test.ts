import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter165: sample additional (repeat/pad)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug repeat 1 = slug`, () => { expect(sample.slug.repeat(1)).toBe(sample.slug); });
      it(`slug repeat 0 = empty`, () => { expect(sample.slug.repeat(0)).toBe(""); });
      it(`slug repeat 2 length`, () => { expect(sample.slug.repeat(2).length).toBe(sample.slug.length * 2); });
      it(`slug padStart no-op`, () => { expect(sample.slug.padStart(sample.slug.length, "x")).toBe(sample.slug); });
      it(`slug padEnd no-op`, () => { expect(sample.slug.padEnd(sample.slug.length, "x")).toBe(sample.slug); });
      it(`label repeat 1 = label`, () => { expect(sample.label.repeat(1)).toBe(sample.label); });
      it(`label padStart no-op`, () => { expect(sample.label.padStart(sample.label.length, "x")).toBe(sample.label); });
    });
  }
});
