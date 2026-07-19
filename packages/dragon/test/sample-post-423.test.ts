import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter424: sample additional (Intl.NumberFormat)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`typeof Intl = object`, () => { expect(typeof Intl).toBe("object"); });
      it(`typeof Intl.NumberFormat = function`, () => { expect(typeof Intl.NumberFormat).toBe("function"); });
      it(`new Intl.NumberFormat().format(1000) is string`, () => { expect(typeof new Intl.NumberFormat().format(1000)).toBe("string"); });
      it(`NumberFormat 0 returns "0"`, () => { expect(new Intl.NumberFormat("en-US").format(0)).toBe("0"); });
      it(`NumberFormat 1000 en-US contains ","`, () => { expect(new Intl.NumberFormat("en-US").format(1000)).toContain(","); });
      it(`(slug.length).toLocaleString() is string`, () => { expect(typeof sample.slug.length.toLocaleString()).toBe("string"); });
      it(`typeof Intl.DateTimeFormat = function`, () => { expect(typeof Intl.DateTimeFormat).toBe("function"); });
    });
  }
});
