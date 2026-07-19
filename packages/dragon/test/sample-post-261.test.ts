import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter262: sample additional (Array join delimiter)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split("").join("") = slug`, () => { expect(sample.slug.split("").join("")).toBe(sample.slug); });
      it(`label split("").join("") = label`, () => { expect(sample.label.split("").join("")).toBe(sample.label); });
      it(`slug split("").join() = comma-joined`, () => { expect(sample.slug.split("").join()).toBe(sample.slug.split("").join(",")); });
      it(`slug split("").join(",") length >= slug length`, () => { expect(sample.slug.split("").join(",").length).toBeGreaterThanOrEqual(sample.slug.length); });
      it(`[slug] join("") = slug`, () => { expect([sample.slug].join("")).toBe(sample.slug); });
      it(`[label] join("") = label`, () => { expect([sample.label].join("")).toBe(sample.label); });
      it(`[] join = ""`, () => { expect([].join("")).toBe(""); });
    });
  }
});
