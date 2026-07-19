import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter169: sample additional (index range)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug[0] defined`, () => { expect(sample.slug[0]).toBeDefined(); });
      it(`slug[last] defined`, () => { expect(sample.slug[sample.slug.length - 1]).toBeDefined(); });
      it(`slug[out] undefined`, () => { expect(sample.slug[sample.slug.length]).toBeUndefined(); });
      it(`label[0] defined`, () => { expect(sample.label[0]).toBeDefined(); });
      it(`label[last] defined`, () => { expect(sample.label[sample.label.length - 1]).toBeDefined(); });
      it(`label[out] undefined`, () => { expect(sample.label[sample.label.length]).toBeUndefined(); });
      it(`code[out] undefined`, () => { expect(sample.code[sample.code.length]).toBeUndefined(); });
    });
  }
});
