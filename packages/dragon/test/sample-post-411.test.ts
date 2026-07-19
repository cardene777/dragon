import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter412: sample additional (TextEncoder/TextDecoder)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`encode/decode round-trip = slug`, () => { const e = new TextEncoder().encode(sample.slug); expect(new TextDecoder().decode(e)).toBe(sample.slug); });
      it(`encode/decode round-trip = label`, () => { const e = new TextEncoder().encode(sample.label); expect(new TextDecoder().decode(e)).toBe(sample.label); });
      it(`encode empty = length 0`, () => { expect(new TextEncoder().encode("").length).toBe(0); });
      it(`decode empty = ""`, () => { expect(new TextDecoder().decode(new Uint8Array())).toBe(""); });
      it(`TextEncoder().encoding = "utf-8"`, () => { expect(new TextEncoder().encoding).toBe("utf-8"); });
      it(`TextDecoder().encoding = "utf-8"`, () => { expect(new TextDecoder().encoding).toBe("utf-8"); });
      it(`typeof TextEncoder = function`, () => { expect(typeof TextEncoder).toBe("function"); });
    });
  }
});
