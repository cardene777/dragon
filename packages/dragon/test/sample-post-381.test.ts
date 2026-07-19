import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter382: sample additional (Object spread order)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`{a:1, b:2} keys ordered`, () => { expect(Object.keys({ a: 1, b: 2 })).toEqual(["a", "b"]); });
      it(`{b:1, a:2} keys ordered`, () => { expect(Object.keys({ b: 1, a: 2 })).toEqual(["b", "a"]); });
      it(`{...sample, extra: 1} last key = extra`, () => { const keys = Object.keys({ ...sample, extra: 1 }); expect(keys[keys.length - 1]).toBe("extra"); });
      it(`{a: 1, ...{b: 2}} = {a:1, b:2}`, () => { expect({ a: 1, ...{ b: 2 } }).toEqual({ a: 1, b: 2 }); });
      it(`{...{a: 1}, a: 2} = {a: 2}`, () => { expect({ ...{ a: 1 }, a: 2 }).toEqual({ a: 2 }); });
      it(`{...sample, slug: "X"}.slug = X`, () => { expect(({ ...sample, slug: "X" }).slug).toBe("X"); });
      it(`{slug: "X", ...sample}.slug = original`, () => { expect(({ slug: "X", ...sample }).slug).toBe(sample.slug); });
    });
  }
});
