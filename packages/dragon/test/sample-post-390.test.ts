import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter391: sample additional (Reflect API)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Reflect.get(sample, "slug") = slug`, () => { expect(Reflect.get(sample, "slug")).toBe(sample.slug); });
      it(`Reflect.get(sample, "label") = label`, () => { expect(Reflect.get(sample, "label")).toBe(sample.label); });
      it(`Reflect.has(sample, "slug") = true`, () => { expect(Reflect.has(sample, "slug")).toBe(true); });
      it(`Reflect.ownKeys(sample) length >= 2`, () => { expect(Reflect.ownKeys(sample).length).toBeGreaterThanOrEqual(2); });
      it(`Reflect.apply((x)=>x, null, [slug]) = slug`, () => { expect(Reflect.apply((x: string) => x, null, [sample.slug])).toBe(sample.slug); });
      it(`Reflect.getPrototypeOf(sample) = Object.prototype`, () => { expect(Reflect.getPrototypeOf(sample)).toBe(Object.prototype); });
      it(`Reflect.construct(Array, [3]).length = 3`, () => { expect(Reflect.construct(Array, [3]).length).toBe(3); });
    });
  }
});
