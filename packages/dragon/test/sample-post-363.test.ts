import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter364: sample additional (Object.assign multi-source)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`assign({}, sample, {}) = sample shape`, () => { expect(Object.assign({}, sample, {}).slug).toBe(sample.slug); });
      it(`assign({}, {a:1}, {b:2}) = {a:1,b:2}`, () => { expect(Object.assign({}, { a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 }); });
      it(`assign({a:1}, {a:2}) = {a:2}`, () => { expect(Object.assign({ a: 1 }, { a: 2 })).toEqual({ a: 2 }); });
      it(`assign({}, sample) not = sample ref`, () => { expect(Object.assign({}, sample)).not.toBe(sample); });
      it(`assign returns target ref`, () => { const target = {}; expect(Object.assign(target, sample)).toBe(target); });
      it(`{...sample, slug: "new"}.slug = "new"`, () => { expect(({ ...sample, slug: "new" }).slug).toBe("new"); });
      it(`{...sample, label: "new"}.label = "new"`, () => { expect(({ ...sample, label: "new" }).label).toBe("new"); });
    });
  }
});
