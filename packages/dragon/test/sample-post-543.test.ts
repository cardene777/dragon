import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter544: sample additional (structuredClone / deep copy)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`structuredClone deep`, () => { const o = { a: { b: 1 } }; const c = structuredClone(o); expect(c).toEqual(o); expect(c.a).not.toBe(o.a); });
      it(`structuredClone array`, () => { const a = [1, [2, 3]]; const c = structuredClone(a); expect(c).toEqual(a); expect(c[1]).not.toBe(a[1]); });
      it(`structuredClone Map`, () => { const m = new Map([["a", 1]]); const c = structuredClone(m); expect(c.get("a")).toBe(1); });
      it(`structuredClone Set`, () => { const s = new Set([1, 2]); const c = structuredClone(s); expect([...c]).toEqual([1, 2]); });
      it(`structuredClone Date`, () => { const d = new Date("2024-01-01"); const c = structuredClone(d); expect(c.getTime()).toBe(d.getTime()); });
      it(`JSON deep copy`, () => { const o = { a: { b: 1 } }; const c = JSON.parse(JSON.stringify(o)); expect(c).toEqual(o); expect(c.a).not.toBe(o.a); });
      it(`structuredClone slug`, () => { expect(structuredClone(sample.slug)).toBe(sample.slug); });
    });
  }
});
