import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter122: sample additional 10 axis", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug no CR`, () => { expect(sample.slug).not.toContain("\r"); });
      it(`slug no backslash`, () => { expect(sample.slug).not.toContain("\\"); });
      it(`slug no quote`, () => { expect(sample.slug).not.toContain('"'); });
      it(`slug no apostrophe`, () => { expect(sample.slug).not.toContain("'"); });
      it(`slug no lt`, () => { expect(sample.slug).not.toContain("<"); });
      it(`slug no gt`, () => { expect(sample.slug).not.toContain(">"); });
      it(`slug no percent`, () => { expect(sample.slug).not.toContain("%"); });
    });
  }
});
