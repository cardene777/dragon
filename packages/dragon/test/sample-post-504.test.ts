import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter505: sample additional (BigInt basic)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`typeof 1n = "bigint"`, () => { expect(typeof 1n).toBe("bigint"); });
      it(`BigInt(1) = 1n`, () => { expect(BigInt(1)).toBe(1n); });
      it(`1n + 2n = 3n`, () => { expect(1n + 2n).toBe(3n); });
      it(`2n * 3n = 6n`, () => { expect(2n * 3n).toBe(6n); });
      it(`10n / 3n = 3n (floor)`, () => { expect(10n / 3n).toBe(3n); });
      it(`1n == 1 = true (loose)`, () => { expect(1n == 1).toBe(true); });
      it(`1n === 1 = false (strict)`, () => { expect(1n === 1 as unknown as bigint).toBe(false); });
    });
  }
});
