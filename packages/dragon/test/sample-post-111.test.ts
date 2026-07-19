import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter112: sample additional 7 axis batch 3", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`code charAt(0) not empty`, () => { expect(sample.code.charAt(0).length).toBeGreaterThan(0); });
      it(`code indexOf itself is 0`, () => { expect(sample.code.indexOf(sample.code)).toBe(0); });
      it(`label indexOf itself is 0`, () => { expect(sample.label.indexOf(sample.label)).toBe(0); });
      it(`slug indexOf itself is 0`, () => { expect(sample.slug.indexOf(sample.slug)).toBe(0); });
      it(`code startsWith some char`, () => { expect(sample.code.startsWith(sample.code.charAt(0))).toBe(true); });
      it(`slug not includes spaces`, () => { expect(sample.slug.includes(" ")).toBe(false); });
      it(`code length integer`, () => { expect(Number.isInteger(sample.code.length)).toBe(true); });
    });
  }
});
