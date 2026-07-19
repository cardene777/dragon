import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter277: sample additional (String Unicode/normalize)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug normalize NFC = normalize NFC`, () => { expect(sample.slug.normalize("NFC")).toBe(sample.slug.normalize("NFC")); });
      it(`label normalize NFC = normalize NFC`, () => { expect(sample.label.normalize("NFC")).toBe(sample.label.normalize("NFC")); });
      it(`slug normalize NFD = normalize NFD`, () => { expect(sample.slug.normalize("NFD")).toBe(sample.slug.normalize("NFD")); });
      it(`label normalize NFD = normalize NFD`, () => { expect(sample.label.normalize("NFD")).toBe(sample.label.normalize("NFD")); });
      it(`slug normalize default = NFC`, () => { expect(sample.slug.normalize()).toBe(sample.slug.normalize("NFC")); });
      it(`label normalize default = NFC`, () => { expect(sample.label.normalize()).toBe(sample.label.normalize("NFC")); });
      it(`slug normalize idempotent`, () => { expect(sample.slug.normalize("NFC").normalize("NFC")).toBe(sample.slug.normalize("NFC")); });
    });
  }
});
