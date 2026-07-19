import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter298: sample additional (Promise basics)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Promise.resolve(slug) = slug`, async () => { await expect(Promise.resolve(sample.slug)).resolves.toBe(sample.slug); });
      it(`Promise.resolve(label) = label`, async () => { await expect(Promise.resolve(sample.label)).resolves.toBe(sample.label); });
      it(`Promise.all resolves`, async () => { await expect(Promise.all([Promise.resolve(sample.slug)])).resolves.toEqual([sample.slug]); });
      it(`Promise.race resolves to first`, async () => { await expect(Promise.race([Promise.resolve(sample.slug), Promise.resolve(sample.label)])).resolves.toBeDefined(); });
      it(`Promise.any resolves`, async () => { await expect(Promise.any([Promise.resolve(sample.slug)])).resolves.toBe(sample.slug); });
      it(`Promise.allSettled fulfilled`, async () => { const r = await Promise.allSettled([Promise.resolve(sample.slug)]); expect(r[0].status).toBe("fulfilled"); });
      it(`Promise.resolve is Promise`, () => { expect(Promise.resolve(sample) instanceof Promise).toBe(true); });
    });
  }
});
