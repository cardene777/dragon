import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter295: sample additional (Array copyWithin/fill)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split copyWithin(0,0) length preserved`, () => { const c = sample.slug.split(""); c.copyWithin(0, 0); expect(c.length).toBe(sample.slug.length); });
      it(`slug split fill returns array itself`, () => { const c = sample.slug.split(""); expect(c.fill("x")).toBe(c); });
      it(`slug split copyWithin returns array itself`, () => { const c = sample.slug.split(""); expect(c.copyWithin(0, 0)).toBe(c); });
      it(`[1,2,3].fill(0) = [0,0,0]`, () => { expect([1, 2, 3].fill(0)).toEqual([0, 0, 0]); });
      it(`[1,2,3].fill(0, 1) = [1,0,0]`, () => { expect([1, 2, 3].fill(0, 1)).toEqual([1, 0, 0]); });
      it(`label split copyWithin(0,0) length preserved`, () => { const c = sample.label.split(""); c.copyWithin(0, 0); expect(c.length).toBe(sample.label.length); });
      it(`label split fill returns array itself`, () => { const c = sample.label.split(""); expect(c.fill("x")).toBe(c); });
    });
  }
});
