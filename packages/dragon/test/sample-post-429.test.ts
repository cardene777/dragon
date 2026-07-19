import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter430: sample additional (Number.toFixed/toPrecision)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`(3.14).toFixed(2) = "3.14"`, () => { expect((3.14).toFixed(2)).toBe("3.14"); });
      it(`(3.14).toFixed(0) = "3"`, () => { expect((3.14).toFixed(0)).toBe("3"); });
      it(`(3.14).toFixed(5) = "3.14000"`, () => { expect((3.14).toFixed(5)).toBe("3.14000"); });
      it(`(3.14).toPrecision(3) = "3.14"`, () => { expect((3.14).toPrecision(3)).toBe("3.14"); });
      it(`(1000).toExponential = "1e+3"`, () => { expect((1000).toExponential()).toBe("1e+3"); });
      it(`slug.length.toFixed(0) = string`, () => { expect(sample.slug.length.toFixed(0)).toBe(String(sample.slug.length)); });
      it(`(0).toFixed(2) = "0.00"`, () => { expect((0).toFixed(2)).toBe("0.00"); });
    });
  }
});
