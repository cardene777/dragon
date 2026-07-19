import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter202: sample additional (Array.reverse/sort)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split reverse reverse = slug`, () => { expect(sample.slug.split("").reverse().reverse().join("")).toBe(sample.slug); });
      it(`label split reverse reverse = label`, () => { expect(sample.label.split("").reverse().reverse().join("")).toBe(sample.label); });
      it(`slug split sort length preserved`, () => { expect(sample.slug.split("").sort().length).toBe(sample.slug.length); });
      it(`label split sort length preserved`, () => { expect(sample.label.split("").sort().length).toBe(sample.label.length); });
      it(`slug split reverse length preserved`, () => { expect(sample.slug.split("").reverse().length).toBe(sample.slug.length); });
      it(`label split reverse length preserved`, () => { expect(sample.label.split("").reverse().length).toBe(sample.label.length); });
      it(`slug split sort idempotent`, () => { const s = sample.slug.split("").sort(); expect(s.slice().sort()).toEqual(s); });
    });
  }
});
