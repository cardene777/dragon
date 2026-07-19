import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter520: sample additional (null / undefined / optional chaining)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`null == undefined = true`, () => { expect(null == undefined).toBe(true); });
      it(`null === undefined = false`, () => { expect(null === undefined as unknown as null).toBe(false); });
      it(`null ?? 42 = 42`, () => { expect(null ?? 42).toBe(42); });
      it(`undefined ?? 42 = 42`, () => { expect(undefined ?? 42).toBe(42); });
      it(`0 ?? 42 = 0`, () => { expect(0 ?? 42).toBe(0); });
      it(`obj?.a = undefined`, () => { const obj: { a?: number } | null = null; expect(obj?.a).toBeUndefined(); });
      it(`obj?.method?.() = undefined`, () => { const obj: { method?: () => number } = {}; expect(obj?.method?.()).toBeUndefined(); });
    });
  }
});
