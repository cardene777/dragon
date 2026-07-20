import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter556: sample additional (Object entries transform)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`map values via entries`, () => { const o = { a: 1, b: 2 }; const r = Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v * 10])); expect(r).toEqual({ a: 10, b: 20 }); });
      it(`filter keys via entries`, () => { const o = { a: 1, b: 2, c: 3 }; const r = Object.fromEntries(Object.entries(o).filter(([, v]) => v > 1)); expect(r).toEqual({ b: 2, c: 3 }); });
      it(`invert keys/values`, () => { const o = { a: "x", b: "y" }; const r = Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k])); expect(r).toEqual({ x: "a", y: "b" }); });
      it(`sum values`, () => { const o = { a: 1, b: 2, c: 3 }; expect(Object.values(o).reduce((a, b) => a + b, 0)).toBe(6); });
      it(`rename keys via entries`, () => { const o = { a: 1 }; const r = Object.fromEntries(Object.entries(o).map(([k, v]) => [k.toUpperCase(), v])); expect(r).toEqual({ A: 1 }); });
      it(`entries length matches keys`, () => { const o = { a: 1, b: 2 }; expect(Object.entries(o).length).toBe(Object.keys(o).length); });
      it(`sample entries include slug`, () => { const keys = Object.entries(sample).map(([k]) => k); expect(keys).toContain("slug"); });
    });
  }
});
