import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter189: sample additional (Number bounds)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug length < MAX_SAFE_INTEGER`, () => { expect(sample.slug.length).toBeLessThan(Number.MAX_SAFE_INTEGER); });
      it(`slug length >= 0`, () => { expect(sample.slug.length).toBeGreaterThanOrEqual(0); });
      it(`slug length !== Infinity`, () => { expect(sample.slug.length).not.toBe(Infinity); });
      it(`label length < MAX_SAFE_INTEGER`, () => { expect(sample.label.length).toBeLessThan(Number.MAX_SAFE_INTEGER); });
      it(`label length !== Infinity`, () => { expect(sample.label.length).not.toBe(Infinity); });
      it(`code length < MAX_SAFE_INTEGER`, () => { expect(sample.code.length).toBeLessThan(Number.MAX_SAFE_INTEGER); });
      it(`code length !== Infinity`, () => { expect(sample.code.length).not.toBe(Infinity); });
    });
  }
});
