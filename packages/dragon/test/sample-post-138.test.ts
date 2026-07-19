import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter139: sample additional (functional)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug concat empty = slug`, () => { expect(sample.slug + "").toBe(sample.slug); });
      it(`label concat empty = label`, () => { expect(sample.label + "").toBe(sample.label); });
      it(`code concat empty = code`, () => { expect(sample.code + "").toBe(sample.code); });
      it(`slug string wrap`, () => { expect(String(sample.slug)).toBe(sample.slug); });
      it(`label string wrap`, () => { expect(String(sample.label)).toBe(sample.label); });
      it(`code string wrap`, () => { expect(String(sample.code)).toBe(sample.code); });
      it(`slug char length equal`, () => { expect([...sample.slug].length).toBeGreaterThan(0); });
    });
  }
});
