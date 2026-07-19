import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter517: sample additional (Iterator / for..of)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`for..of array`, () => { let sum = 0; for (const v of [1, 2, 3]) sum += v; expect(sum).toBe(6); });
      it(`for..of string`, () => { const chars: string[] = []; for (const c of "abc") chars.push(c); expect(chars).toEqual(["a", "b", "c"]); });
      it(`for..of Set`, () => { const vals: number[] = []; for (const v of new Set([1, 2, 3])) vals.push(v); expect(vals).toEqual([1, 2, 3]); });
      it(`for..in object keys`, () => { const keys: string[] = []; for (const k in { a: 1, b: 2 }) keys.push(k); expect(keys).toEqual(["a", "b"]); });
      it(`iterable protocol`, () => { const iter = [1, 2][Symbol.iterator](); expect(iter.next().value).toBe(1); expect(iter.next().value).toBe(2); });
      it(`for..of slug`, () => { let count = 0; for (const _ of sample.slug) count++; expect(count).toBe(sample.slug.length); });
      it(`spread iterable`, () => { expect([...new Set([1, 1, 2])]).toEqual([1, 2]); });
    });
  }
});
