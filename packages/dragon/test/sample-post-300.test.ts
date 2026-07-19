import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter301: sample additional (async/await)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`async fn returns Promise`, async () => { const f = async () => sample; expect(f() instanceof Promise).toBe(true); });
      it(`await async fn = sample`, async () => { const f = async () => sample; expect(await f()).toBe(sample); });
      it(`async fn awaiting slug = slug`, async () => { const f = async () => sample.slug; expect(await f()).toBe(sample.slug); });
      it(`async fn awaiting label = label`, async () => { const f = async () => sample.label; expect(await f()).toBe(sample.label); });
      it(`async fn chain returns sample`, async () => { const f = async () => await Promise.resolve(sample); expect(await f()).toBe(sample); });
      it(`async fn throws caught`, async () => { const f = async () => { throw new Error(sample.slug); }; await expect(f()).rejects.toThrow(sample.slug); });
      it(`async fn then chain`, async () => { const p = (async () => sample)().then(x => x); expect(await p).toBe(sample); });
    });
  }
});
