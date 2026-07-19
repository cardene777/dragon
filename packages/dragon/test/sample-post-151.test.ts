import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter152: sample additional (case)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug lower ok`, () => { expect(sample.slug.toLowerCase()).toBeTruthy(); });
      it(`slug upper ok`, () => { expect(sample.slug.toUpperCase()).toBeTruthy(); });
      it(`slug lower length`, () => { expect(sample.slug.toLowerCase().length).toBe(sample.slug.length); });
      it(`slug trim eq`, () => { expect(sample.slug.trim()).toBe(sample.slug); });
      it(`label trim eq`, () => { expect(sample.label.trim()).toBe(sample.label); });
      it(`slug trimStart eq`, () => { expect(sample.slug.trimStart()).toBe(sample.slug); });
      it(`slug trimEnd eq`, () => { expect(sample.slug.trimEnd()).toBe(sample.slug); });
    });
  }
});
