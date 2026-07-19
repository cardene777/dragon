import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter126: sample additional 11 axis", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug no colon`, () => { expect(sample.slug).not.toContain(":"); });
      it(`slug no semicolon`, () => { expect(sample.slug).not.toContain(";"); });
      it(`slug no comma`, () => { expect(sample.slug).not.toContain(","); });
      it(`slug no equals`, () => { expect(sample.slug).not.toContain("="); });
      it(`slug no bracket open`, () => { expect(sample.slug).not.toContain("["); });
      it(`slug no bracket close`, () => { expect(sample.slug).not.toContain("]"); });
      it(`slug no dollar`, () => { expect(sample.slug).not.toContain("$"); });
    });
  }
});
