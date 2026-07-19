import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter195: sample additional (String static methods)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug String() coerce = slug`, () => { expect(String(sample.slug)).toBe(sample.slug); });
      it(`label String() coerce = label`, () => { expect(String(sample.label)).toBe(sample.label); });
      it(`code String() coerce = code`, () => { expect(String(sample.code)).toBe(sample.code); });
      it(`slug normalize eq`, () => { expect(sample.slug.normalize()).toBe(sample.slug.normalize("NFC")); });
      it(`label normalize eq`, () => { expect(sample.label.normalize()).toBe(sample.label.normalize("NFC")); });
      it(`slug localeCompare self = 0`, () => { expect(sample.slug.localeCompare(sample.slug)).toBe(0); });
      it(`label localeCompare self = 0`, () => { expect(sample.label.localeCompare(sample.label)).toBe(0); });
    });
  }
});
