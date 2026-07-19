import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter529: sample additional (Reflect)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Reflect.has({a:1}, "a") = true`, () => { expect(Reflect.has({ a: 1 }, "a")).toBe(true); });
      it(`Reflect.has({a:1}, "b") = false`, () => { expect(Reflect.has({ a: 1 }, "b")).toBe(false); });
      it(`Reflect.get({a:1}, "a") = 1`, () => { expect(Reflect.get({ a: 1 }, "a")).toBe(1); });
      it(`Reflect.set works`, () => { const o: Record<string, number> = {}; Reflect.set(o, "a", 5); expect(o.a).toBe(5); });
      it(`Reflect.deleteProperty works`, () => { const o = { a: 1 }; Reflect.deleteProperty(o, "a"); expect((o as Partial<typeof o>).a).toBeUndefined(); });
      it(`Reflect.ownKeys({a:1,b:2}) = ["a","b"]`, () => { expect(Reflect.ownKeys({ a: 1, b: 2 })).toEqual(["a", "b"]); });
      it(`Reflect.getPrototypeOf(obj)`, () => { expect(Reflect.getPrototypeOf({})).toBe(Object.prototype); });
    });
  }
});
