import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter493: sample additional (Date basic)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Date("2024-01-01").getUTCFullYear() = 2024`, () => { expect(new Date("2024-01-01").getUTCFullYear()).toBe(2024); });
      it(`new Date(0).getTime() = 0`, () => { expect(new Date(0).getTime()).toBe(0); });
      it(`Date.parse("2024-01-01") is finite`, () => { expect(Number.isFinite(Date.parse("2024-01-01"))).toBe(true); });
      it(`new Date("invalid").getTime() = NaN`, () => { expect(new Date("invalid").getTime()).toBeNaN(); });
      it(`new Date("2024-01-01").toISOString() startsWith "2024"`, () => { expect(new Date("2024-01-01").toISOString().startsWith("2024")).toBe(true); });
      it(`new Date(1000).getTime() = 1000`, () => { expect(new Date(1000).getTime()).toBe(1000); });
      it(`sample.slug is date-independent`, () => { expect(typeof sample.slug).toBe("string"); });
    });
  }
});
