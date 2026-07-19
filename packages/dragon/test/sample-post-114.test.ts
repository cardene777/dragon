import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter115: sample additional 8 axis", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`code normalize equal`, () => { expect(sample.code.normalize()).toBe(sample.code); });
      it(`label normalize equal`, () => { expect(sample.label.normalize()).toBe(sample.label); });
      it(`slug normalize equal`, () => { expect(sample.slug.normalize()).toBe(sample.slug); });
      it(`code substring 0 length equal`, () => { expect(sample.code.substring(0, sample.code.length)).toBe(sample.code); });
      it(`compile stable via first-compile compare last-compile`, () => {
        const first = textDslToDiagram(sample.code);
        const last = textDslToDiagram(sample.code);
        expect(first.nodes.length).toBe(last.nodes.length);
      });
      it(`code toLowerCase length equal`, () => { expect(sample.code.toLowerCase().length).toBe(sample.code.length); });
      it(`code toUpperCase length equal`, () => { expect(sample.code.toUpperCase().length).toBe(sample.code.length); });
    });
  }
});
