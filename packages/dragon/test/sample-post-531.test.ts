import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter532: sample additional (Object prototype)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Object.create(null) no prototype`, () => { expect(Object.getPrototypeOf(Object.create(null))).toBeNull(); });
      it(`Object.create(proto) inherits`, () => { const proto = { a: 1 }; const o = Object.create(proto); expect(Object.getPrototypeOf(o)).toBe(proto); });
      it(`Object.getPrototypeOf({}) = Object.prototype`, () => { expect(Object.getPrototypeOf({})).toBe(Object.prototype); });
      it(`Object.setPrototypeOf works`, () => { const o: Record<string, unknown> = {}; Object.setPrototypeOf(o, { a: 1 }); expect((o as { a?: number }).a).toBe(1); });
      it(`Object.hasOwn works`, () => { expect(Object.hasOwn({ a: 1 }, "a")).toBe(true); expect(Object.hasOwn({ a: 1 }, "b")).toBe(false); });
      it(`hasOwnProperty inherited excluded`, () => { const child = Object.create({ inherited: 1 }); child.own = 2; expect(Object.hasOwn(child, "own")).toBe(true); expect(Object.hasOwn(child, "inherited")).toBe(false); });
      it(`Object.getOwnPropertyNames`, () => { expect(Object.getOwnPropertyNames({ a: 1, b: 2 })).toEqual(["a", "b"]); });
    });
  }
});
