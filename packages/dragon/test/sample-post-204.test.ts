import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter205: sample additional (String replace/replaceAll)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug replace empty = same`, () => { expect(sample.slug.replace("", "")).toBe(sample.slug); });
      it(`label replace empty = same`, () => { expect(sample.label.replace("", "")).toBe(sample.label); });
      it(`slug replaceAll self self = same`, () => { expect(sample.slug.replaceAll(sample.slug, sample.slug)).toBe(sample.slug); });
      it(`label replaceAll self self = same`, () => { expect(sample.label.replaceAll(sample.label, sample.label)).toBe(sample.label); });
      it(`slug replaceAll nonexistent = slug`, () => { expect(sample.slug.replaceAll("___NOTEXIST___", "X")).toBe(sample.slug); });
      it(`slug normalize NFC idempotent`, () => { expect(sample.slug.normalize("NFC").normalize("NFC")).toBe(sample.slug.normalize("NFC")); });
      it(`label normalize NFD idempotent`, () => { expect(sample.label.normalize("NFD").normalize("NFD")).toBe(sample.label.normalize("NFD")); });
    });
  }
});
