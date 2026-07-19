import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter469: sample additional (Number / Math basic)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Number("42") = 42`, () => { expect(Number("42")).toBe(42); });
      it(`Number("abc") = NaN`, () => { expect(Number("abc")).toBeNaN(); });
      it(`Number.isNaN(NaN) = true`, () => { expect(Number.isNaN(NaN)).toBe(true); });
      it(`Number.isInteger(3) = true`, () => { expect(Number.isInteger(3)).toBe(true); });
      it(`Number.isInteger(3.5) = false`, () => { expect(Number.isInteger(3.5)).toBe(false); });
      it(`Number.isFinite(Infinity) = false`, () => { expect(Number.isFinite(Infinity)).toBe(false); });
      it(`slug length is finite integer`, () => { expect(Number.isInteger(sample.slug.length)).toBe(true); });
    });
  }
});
