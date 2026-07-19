import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter283: sample additional (Function bind/call/apply)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`identity(slug) = slug`, () => { expect(((x: string) => x)(sample.slug)).toBe(sample.slug); });
      it(`identity.call(null, label) = label`, () => { const f = function (x: string) { return x; }; expect(f.call(null, sample.label)).toBe(sample.label); });
      it(`identity.apply(null, [slug]) = slug`, () => { const f = function (x: string) { return x; }; expect(f.apply(null, [sample.slug])).toBe(sample.slug); });
      it(`identity.bind(null)(label) = label`, () => { const f = function (x: string) { return x; }; expect(f.bind(null)(sample.label)).toBe(sample.label); });
      it(`identity.bind(null, slug)() = slug`, () => { const f = function (x: string) { return x; }; expect(f.bind(null, sample.slug)()).toBe(sample.slug); });
      it(`typeof identity = function`, () => { expect(typeof ((x: string) => x)).toBe("function"); });
      it(`identity.length = 1`, () => { expect(((x: string) => x).length).toBe(1); });
    });
  }
});
