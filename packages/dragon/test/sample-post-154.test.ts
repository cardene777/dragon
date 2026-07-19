import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter155: sample additional (regex-like)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug matches non-empty`, () => { expect(sample.slug).toMatch(/./); });
      it(`slug matches printable`, () => { expect(sample.slug).toMatch(/[\x20-\x7e]/); });
      it(`slug no double dash`, () => { expect(sample.slug.includes("--")).toBe(false); });
      it(`slug not start dash`, () => { expect(sample.slug.startsWith("-")).toBe(false); });
      it(`slug not end dash`, () => { expect(sample.slug.endsWith("-")).toBe(false); });
      it(`slug split "-" first non-empty`, () => { expect(sample.slug.split("-")[0].length).toBeGreaterThan(0); });
      it(`label matches non-empty`, () => { expect(sample.label).toMatch(/./); });
    });
  }
});
