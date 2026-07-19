import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter433: sample additional (Reflect.preventExtensions/deleteProperty)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Reflect.preventExtensions returns true`, () => { const o = {}; expect(Reflect.preventExtensions(o)).toBe(true); });
      it(`Reflect.preventExtensions prevents extension`, () => { const o: Record<string, unknown> = {}; Reflect.preventExtensions(o); expect(Reflect.isExtensible(o)).toBe(false); });
      it(`Reflect.deleteProperty deletes prop`, () => { const o = { x: 1 }; expect(Reflect.deleteProperty(o, "x")).toBe(true); expect((o as { x?: number }).x).toBeUndefined(); });
      it(`Reflect.set returns true`, () => { const o: Record<string, unknown> = {}; expect(Reflect.set(o, "x", 1)).toBe(true); expect(o.x).toBe(1); });
      it(`Reflect.defineProperty returns true`, () => { const o: Record<string, unknown> = {}; expect(Reflect.defineProperty(o, "x", { value: 1 })).toBe(true); });
      it(`Reflect.getPrototypeOf(sample) = Object.prototype`, () => { expect(Reflect.getPrototypeOf(sample)).toBe(Object.prototype); });
      it(`Reflect.setPrototypeOf returns true`, () => { const o = {}; expect(Reflect.setPrototypeOf(o, null)).toBe(true); });
    });
  }
});
