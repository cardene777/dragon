import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter119: sample additional 9 axis", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug no space`, () => { expect(sample.slug).not.toContain(" "); });
      it(`slug no newline`, () => { expect(sample.slug).not.toContain("\n"); });
      it(`slug no tab`, () => { expect(sample.slug).not.toContain("\t"); });
      it(`slug no null char`, () => { expect(sample.slug).not.toContain("\0"); });
      it(`slug matches kebab regex`, () => { expect(sample.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/); });
      it(`label truthy`, () => { expect(sample.label).toBeTruthy(); });
      it(`code truthy`, () => { expect(sample.code).toBeTruthy(); });
    });
  }
});
