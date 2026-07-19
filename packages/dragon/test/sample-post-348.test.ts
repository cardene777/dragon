import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter349: sample additional (String static / raw)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`String(slug) = slug`, () => { expect(String(sample.slug)).toBe(sample.slug); });
      it(`String(label) = label`, () => { expect(String(sample.label)).toBe(sample.label); });
      it(`new String(slug).valueOf = slug`, () => { expect(new String(sample.slug).valueOf()).toBe(sample.slug); });
      it(`new String(label).valueOf = label`, () => { expect(new String(sample.label).valueOf()).toBe(sample.label); });
      it(`String.raw returns string`, () => { expect(typeof String.raw`x`).toBe("string"); });
      it(`String.fromCharCode returns string`, () => { expect(typeof String.fromCharCode(65)).toBe("string"); });
      it(`String.fromCodePoint returns string`, () => { expect(typeof String.fromCodePoint(65)).toBe("string"); });
    });
  }
});
