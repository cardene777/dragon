import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter289: sample additional (String.at negative index)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug at(-length) = first if nonempty`, () => { if (sample.slug.length) expect(sample.slug.at(-sample.slug.length)).toBe(sample.slug[0]); });
      it(`slug at(-length-1) = undefined`, () => { expect(sample.slug.at(-sample.slug.length - 1)).toBeUndefined(); });
      it(`label at(-length) = first if nonempty`, () => { if (sample.label.length) expect(sample.label.at(-sample.label.length)).toBe(sample.label[0]); });
      it(`label at(-length-1) = undefined`, () => { expect(sample.label.at(-sample.label.length - 1)).toBeUndefined(); });
      it(`slug at() = at(0)`, () => { expect(sample.slug.at()).toBe(sample.slug.at(0)); });
      it(`slug at(Infinity) = undefined`, () => { expect(sample.slug.at(Infinity)).toBeUndefined(); });
      it(`label at(-Infinity) = undefined`, () => { expect(sample.label.at(-Infinity)).toBeUndefined(); });
    });
  }
});
