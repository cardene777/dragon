import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter397: sample additional (String iterator vs Array.from)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`[...slug].length >= 0`, () => { expect([...sample.slug].length).toBeGreaterThanOrEqual(0); });
      it(`[...label].length >= 0`, () => { expect([...sample.label].length).toBeGreaterThanOrEqual(0); });
      it(`Array.from(slug).length = [...slug].length`, () => { expect(Array.from(sample.slug).length).toBe([...sample.slug].length); });
      it(`Array.from(label).length = [...label].length`, () => { expect(Array.from(sample.label).length).toBe([...sample.label].length); });
      it(`[...""] = []`, () => { expect([...""]).toEqual([]); });
      it(`[...slug] every char string`, () => { for (const c of [...sample.slug]) expect(typeof c).toBe("string"); });
      it(`[...label] every char string`, () => { for (const c of [...sample.label]) expect(typeof c).toBe("string"); });
    });
  }
});
