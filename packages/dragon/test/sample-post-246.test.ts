import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter247: sample additional (Array iterator)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`[...slug.split("").keys()] length = slug length`, () => { expect([...sample.slug.split("").keys()].length).toBe(sample.slug.length); });
      it(`[...slug.split("").values()] length = slug length`, () => { expect([...sample.slug.split("").values()].length).toBe(sample.slug.length); });
      it(`[...slug.split("").entries()] length = slug length`, () => { expect([...sample.slug.split("").entries()].length).toBe(sample.slug.length); });
      it(`[...label.split("").keys()] length = label length`, () => { expect([...sample.label.split("").keys()].length).toBe(sample.label.length); });
      it(`[...label.split("").values()] length = label length`, () => { expect([...sample.label.split("").values()].length).toBe(sample.label.length); });
      it(`[...slug.split("").values()] join = slug`, () => { expect([...sample.slug.split("").values()].join("")).toBe(sample.slug); });
      it(`[...slug.split("").keys()] is index array`, () => { expect([...sample.slug.split("").keys()]).toEqual(sample.slug.split("").map((_, i) => i)); });
    });
  }
});
