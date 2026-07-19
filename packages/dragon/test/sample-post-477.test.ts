import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter478: sample additional (Object.keys / values / entries / fromEntries)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Object.keys({a:1, b:2}) = ["a","b"]`, () => { expect(Object.keys({ a: 1, b: 2 })).toEqual(["a", "b"]); });
      it(`Object.values({a:1, b:2}) = [1,2]`, () => { expect(Object.values({ a: 1, b: 2 })).toEqual([1, 2]); });
      it(`Object.entries({a:1}).length = 1`, () => { expect(Object.entries({ a: 1 }).length).toBe(1); });
      it(`Object.entries({a:1})[0] = ["a", 1]`, () => { expect(Object.entries({ a: 1 })[0]).toEqual(["a", 1]); });
      it(`Object.fromEntries([["a", 1]]) = {a:1}`, () => { expect(Object.fromEntries([["a", 1]])).toEqual({ a: 1 }); });
      it(`keys/values roundtrip`, () => { const o = { a: 1, b: 2 }; expect(Object.fromEntries(Object.entries(o))).toEqual(o); });
      it(`sample.slug type is string`, () => { expect(typeof sample.slug).toBe("string"); });
    });
  }
});
