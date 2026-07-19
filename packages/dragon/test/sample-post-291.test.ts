import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter292: sample additional (Array from iterable/generator)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Array.from(slug[Symbol.iterator]()) length > 0`, () => { if (sample.slug.length) expect(Array.from(sample.slug[Symbol.iterator]()).length).toBeGreaterThan(0); });
      it(`Array.from(label[Symbol.iterator]()) length > 0`, () => { if (sample.label.length) expect(Array.from(sample.label[Symbol.iterator]()).length).toBeGreaterThan(0); });
      it(`Array.from(gen) length = 3`, () => { function* g() { yield 1; yield 2; yield 3; } expect(Array.from(g()).length).toBe(3); });
      it(`Array.from(slug) join = slug`, () => { expect(Array.from(sample.slug).join("")).toBe(sample.slug); });
      it(`Array.from(label) join = label`, () => { expect(Array.from(sample.label).join("")).toBe(sample.label); });
      it(`Array.from with mapFn`, () => { expect(Array.from(sample.slug, () => 1).length).toBe(Array.from(sample.slug).length); });
      it(`Array.from empty iter = []`, () => { function* g() { /* empty */ } expect(Array.from(g())).toEqual([]); });
    });
  }
});
