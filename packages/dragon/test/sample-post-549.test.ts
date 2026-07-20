import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter550: sample additional (Number precision / EPSILON)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`0.1 + 0.2 != 0.3 (float)`, () => { expect(0.1 + 0.2).not.toBe(0.3); });
      it(`EPSILON compare 0.1+0.2 ~ 0.3`, () => { expect(Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON).toBe(true); });
      it(`Number.MAX_SAFE_INTEGER`, () => { expect(Number.MAX_SAFE_INTEGER).toBe(9007199254740991); });
      it(`Number.isSafeInteger`, () => { expect(Number.isSafeInteger(2 ** 53)).toBe(false); expect(Number.isSafeInteger(2 ** 53 - 1)).toBe(true); });
      it(`Number.MIN_VALUE > 0`, () => { expect(Number.MIN_VALUE).toBeGreaterThan(0); });
      it(`Number.MAX_VALUE finite`, () => { expect(Number.isFinite(Number.MAX_VALUE)).toBe(true); });
      it(`1/0 = Infinity`, () => { expect(1 / 0).toBe(Infinity); });
    });
  }
});
