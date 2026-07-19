import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter253: sample additional (startsWith/endsWith)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug startsWith "" = true`, () => { expect(sample.slug.startsWith("")).toBe(true); });
      it(`slug endsWith "" = true`, () => { expect(sample.slug.endsWith("")).toBe(true); });
      it(`label startsWith "" = true`, () => { expect(sample.label.startsWith("")).toBe(true); });
      it(`label endsWith "" = true`, () => { expect(sample.label.endsWith("")).toBe(true); });
      it(`slug startsWith self = true`, () => { expect(sample.slug.startsWith(sample.slug)).toBe(true); });
      it(`slug endsWith self = true`, () => { expect(sample.slug.endsWith(sample.slug)).toBe(true); });
      it(`slug includes self = true`, () => { expect(sample.slug.includes(sample.slug)).toBe(true); });
    });
  }
});
