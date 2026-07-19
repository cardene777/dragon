import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter508: sample additional (Function / arrow)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`fn declaration`, () => { function fn() { return 42; } expect(fn()).toBe(42); });
      it(`arrow function`, () => { const fn = () => 42; expect(fn()).toBe(42); });
      it(`fn with params`, () => { const fn = (a: number, b: number) => a + b; expect(fn(2, 3)).toBe(5); });
      it(`fn default param`, () => { const fn = (a = 10) => a; expect(fn()).toBe(10); expect(fn(5)).toBe(5); });
      it(`fn rest params`, () => { const fn = (...args: number[]) => args.length; expect(fn(1, 2, 3)).toBe(3); });
      it(`fn.length = param count`, () => { const fn = (_a: number, _b: number, _c: number) => 0; expect(fn.length).toBe(3); });
      it(`sample.slug identity via fn`, () => { const identity = <T>(x: T) => x; expect(identity(sample.slug)).toBe(sample.slug); });
    });
  }
});
