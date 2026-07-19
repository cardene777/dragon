import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter159: sample additional (misc)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug defined`, () => { expect(sample.slug).toBeDefined(); });
      it(`label defined`, () => { expect(sample.label).toBeDefined(); });
      it(`code defined`, () => { expect(sample.code).toBeDefined(); });
      it(`slug not undefined`, () => { expect(sample.slug).not.toBe(undefined); });
      it(`label not undefined`, () => { expect(sample.label).not.toBe(undefined); });
      it(`slug not empty string`, () => { expect(sample.slug).not.toBe(""); });
      it(`label not empty string`, () => { expect(sample.label).not.toBe(""); });
    });
  }
});
