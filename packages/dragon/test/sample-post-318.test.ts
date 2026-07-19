import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter319: sample additional (Symbol behavior)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`typeof Symbol(slug) = symbol`, () => { expect(typeof Symbol(sample.slug)).toBe("symbol"); });
      it(`Symbol(slug) !== Symbol(slug)`, () => { expect(Symbol(sample.slug) === Symbol(sample.slug)).toBe(false); });
      it(`Symbol(label).description = label`, () => { expect(Symbol(sample.label).description).toBe(sample.label); });
      it(`Symbol(slug).description = slug`, () => { expect(Symbol(sample.slug).description).toBe(sample.slug); });
      it(`Symbol.for(slug) idempotent`, () => { expect(Symbol.for(sample.slug) === Symbol.for(sample.slug)).toBe(true); });
      it(`Symbol.for(label) idempotent`, () => { expect(Symbol.for(sample.label) === Symbol.for(sample.label)).toBe(true); });
      it(`Symbol().toString starts with Symbol`, () => { expect(Symbol("x").toString().startsWith("Symbol")).toBe(true); });
    });
  }
});
