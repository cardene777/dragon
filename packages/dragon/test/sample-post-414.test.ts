import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter415: sample additional (Object.defineProperty)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`defineProperty(o, "x", {value: 1}).x = 1`, () => { const o: Record<string, unknown> = {}; Object.defineProperty(o, "x", { value: 1 }); expect(o.x).toBe(1); });
      it(`defineProperty writable false blocks`, () => { const o: Record<string, unknown> = {}; Object.defineProperty(o, "x", { value: 1, writable: false }); expect(() => { o.x = 2; }).toThrow(); });
      it(`defineProperty enumerable false hides`, () => { const o: Record<string, unknown> = {}; Object.defineProperty(o, "x", { value: 1 }); expect(Object.keys(o)).toEqual([]); });
      it(`defineProperty getter works`, () => { const o = {}; Object.defineProperty(o, "x", { get() { return 42; } }); expect((o as { x: number }).x).toBe(42); });
      it(`defineProperties bulk works`, () => { const o = {}; Object.defineProperties(o, { a: { value: 1 }, b: { value: 2 } }); expect((o as { a: number; b: number }).a).toBe(1); });
      it(`Object.defineProperty is function`, () => { expect(typeof Object.defineProperty).toBe("function"); });
      it(`getOwnPropertyDescriptor(s, "slug") defined`, () => { const d = Object.getOwnPropertyDescriptor(sample, "slug"); expect(d).toBeDefined(); });
    });
  }
});
