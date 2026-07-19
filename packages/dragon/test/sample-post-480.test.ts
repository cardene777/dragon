import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter481: sample additional (JSON parse / stringify)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`JSON.stringify({a:1}) = '{"a":1}'`, () => { expect(JSON.stringify({ a: 1 })).toBe('{"a":1}'); });
      it(`JSON.parse('{"a":1}') = {a:1}`, () => { expect(JSON.parse('{"a":1}')).toEqual({ a: 1 }); });
      it(`JSON.stringify([1,2]) = "[1,2]"`, () => { expect(JSON.stringify([1, 2])).toBe("[1,2]"); });
      it(`JSON.parse("[1,2]") = [1,2]`, () => { expect(JSON.parse("[1,2]")).toEqual([1, 2]); });
      it(`JSON.stringify(null) = "null"`, () => { expect(JSON.stringify(null)).toBe("null"); });
      it(`JSON.parse('"abc"') = "abc"`, () => { expect(JSON.parse('"abc"')).toBe("abc"); });
      it(`sample slug roundtrip`, () => { expect(JSON.parse(JSON.stringify(sample.slug))).toBe(sample.slug); });
    });
  }
});
