import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter337: sample additional (BigInt basics)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`typeof BigInt(slug.length) = bigint`, () => { expect(typeof BigInt(sample.slug.length)).toBe("bigint"); });
      it(`typeof BigInt(label.length) = bigint`, () => { expect(typeof BigInt(sample.label.length)).toBe("bigint"); });
      it(`Number(BigInt(slug.length)) = slug.length`, () => { expect(Number(BigInt(sample.slug.length))).toBe(sample.slug.length); });
      it(`1n + 1n = 2n`, () => { expect(1n + 1n).toBe(2n); });
      it(`0n === 0n`, () => { expect(0n === 0n).toBe(true); });
      it(`BigInt.asIntN(64, 1n) = 1n`, () => { expect(BigInt.asIntN(64, 1n)).toBe(1n); });
      it(`1n.toString = "1"`, () => { expect((1n).toString()).toBe("1"); });
    });
  }
});
