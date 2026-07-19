import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter268: sample additional (bracket indexing)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug[0] = charAt(0)`, () => { if (sample.slug.length) expect(sample.slug[0]).toBe(sample.slug.charAt(0)); });
      it(`slug[length] = undefined`, () => { expect(sample.slug[sample.slug.length]).toBeUndefined(); });
      it(`slug[-1] = undefined`, () => { expect((sample.slug as unknown as string[])[-1]).toBeUndefined(); });
      it(`label[0] = charAt(0)`, () => { if (sample.label.length) expect(sample.label[0]).toBe(sample.label.charAt(0)); });
      it(`label[length] = undefined`, () => { expect(sample.label[sample.label.length]).toBeUndefined(); });
      it(`slug[length-1] = last char (nonempty)`, () => { if (sample.slug.length) expect(sample.slug[sample.slug.length - 1]).toBe(sample.slug.slice(-1)); });
      it(`label[length-1] = last char (nonempty)`, () => { if (sample.label.length) expect(sample.label[sample.label.length - 1]).toBe(sample.label.slice(-1)); });
    });
  }
});
