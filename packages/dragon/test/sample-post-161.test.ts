import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter162: sample additional (identity)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug !== null`, () => { expect(sample.slug === null).toBe(false); });
      it(`label !== null`, () => { expect(sample.label === null).toBe(false); });
      it(`code !== null`, () => { expect(sample.code === null).toBe(false); });
      it(`slug truthy`, () => { expect(Boolean(sample.slug)).toBe(true); });
      it(`label truthy`, () => { expect(Boolean(sample.label)).toBe(true); });
      it(`slug !== 0`, () => { expect(sample.slug === (0 as unknown as string)).toBe(false); });
      it(`label !== 0`, () => { expect(sample.label === (0 as unknown as string)).toBe(false); });
    });
  }
});
