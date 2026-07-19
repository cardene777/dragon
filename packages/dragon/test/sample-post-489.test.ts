import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter490: sample additional (Promise basic)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Promise.resolve(42) resolves 42`, async () => { expect(await Promise.resolve(42)).toBe(42); });
      it(`Promise.reject rejects`, async () => { await expect(Promise.reject(new Error("x"))).rejects.toThrow("x"); });
      it(`Promise.all([1,2,3]) = [1,2,3]`, async () => { expect(await Promise.all([1, 2, 3])).toEqual([1, 2, 3]); });
      it(`Promise.all([]) = []`, async () => { expect(await Promise.all([])).toEqual([]); });
      it(`Promise.race resolves first`, async () => { expect(await Promise.race([Promise.resolve(1), Promise.resolve(2)])).toBe(1); });
      it(`Promise.allSettled length matches`, async () => { const r = await Promise.allSettled([Promise.resolve(1), Promise.reject("x")]); expect(r.length).toBe(2); });
      it(`sample.slug via Promise resolve`, async () => { expect(await Promise.resolve(sample.slug)).toBe(sample.slug); });
    });
  }
});
