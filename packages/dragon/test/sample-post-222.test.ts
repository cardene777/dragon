import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter223: sample additional (filter/map)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split filter truthy = same`, () => { expect(sample.slug.split("").filter(() => true).join("")).toBe(sample.slug); });
      it(`slug split filter falsy = ""`, () => { expect(sample.slug.split("").filter(() => false).join("")).toBe(""); });
      it(`label split filter truthy = same`, () => { expect(sample.label.split("").filter(() => true).join("")).toBe(sample.label); });
      it(`slug split map identity = same`, () => { expect(sample.slug.split("").map(c => c).join("")).toBe(sample.slug); });
      it(`label split map identity = same`, () => { expect(sample.label.split("").map(c => c).join("")).toBe(sample.label); });
      it(`slug split filter+map chain = slug`, () => { expect(sample.slug.split("").filter(() => true).map(c => c).join("")).toBe(sample.slug); });
      it(`slug split map uppercase toLowerCase = slug lowercase`, () => { expect(sample.slug.split("").map(c => c.toUpperCase()).map(c => c.toLowerCase()).join("")).toBe(sample.slug.toLowerCase()); });
    });
  }
});
