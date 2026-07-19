import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter220: sample additional (every/some)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split every truthy = true`, () => { expect(sample.slug.split("").every(() => true)).toBe(true); });
      it(`slug split every falsy nonempty = false`, () => { if (sample.slug.length) expect(sample.slug.split("").every(() => false)).toBe(false); });
      it(`slug split some truthy nonempty = true`, () => { if (sample.slug.length) expect(sample.slug.split("").some(() => true)).toBe(true); });
      it(`slug split some falsy = false`, () => { expect(sample.slug.split("").some(() => false)).toBe(false); });
      it(`label split every truthy = true`, () => { expect(sample.label.split("").every(() => true)).toBe(true); });
      it(`label split some falsy = false`, () => { expect(sample.label.split("").some(() => false)).toBe(false); });
      it(`slug split every char typeof string`, () => { expect(sample.slug.split("").every(c => typeof c === "string")).toBe(true); });
    });
  }
});
