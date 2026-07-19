import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter211: sample additional (flat/flatMap/at)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split flat 0 = same`, () => { expect(sample.slug.split("").flat(0)).toEqual(sample.slug.split("")); });
      it(`slug split flatMap identity = same`, () => { expect(sample.slug.split("").flatMap(c => [c]).join("")).toBe(sample.slug); });
      it(`slug split flatMap empty = []`, () => { expect(sample.slug.split("").flatMap(() => [])).toEqual([]); });
      it(`slug at 0 nonempty = first char`, () => { if (sample.slug.length) expect(sample.slug.at(0)).toBe(sample.slug[0]); });
      it(`slug at -1 nonempty = last char`, () => { if (sample.slug.length) expect(sample.slug.at(-1)).toBe(sample.slug[sample.slug.length - 1]); });
      it(`label at 0 nonempty = first char`, () => { if (sample.label.length) expect(sample.label.at(0)).toBe(sample.label[0]); });
      it(`slug at length = undefined`, () => { expect(sample.slug.at(sample.slug.length)).toBeUndefined(); });
    });
  }
});
