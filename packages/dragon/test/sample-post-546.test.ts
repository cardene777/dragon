import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter547: sample additional (Array group / reduce advanced)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`groupBy via reduce`, () => { const g = [1, 2, 3, 4].reduce<Record<string, number[]>>((acc, n) => { const k = n % 2 === 0 ? "even" : "odd"; (acc[k] ??= []).push(n); return acc; }, {}); expect(g.even).toEqual([2, 4]); });
      it(`count via reduce`, () => { const c = ["a", "b", "a"].reduce<Record<string, number>>((acc, x) => { acc[x] = (acc[x] ?? 0) + 1; return acc; }, {}); expect(c.a).toBe(2); });
      it(`flatten via reduce`, () => { expect([[1], [2], [3]].reduce((a, b) => a.concat(b), [] as number[])).toEqual([1, 2, 3]); });
      it(`max via reduce`, () => { expect([3, 7, 2].reduce((a, b) => Math.max(a, b), -Infinity)).toBe(7); });
      it(`unique via reduce`, () => { const u = [1, 1, 2, 3, 3].reduce<number[]>((acc, n) => acc.includes(n) ? acc : [...acc, n], []); expect(u).toEqual([1, 2, 3]); });
      it(`char count in slug`, () => { const c = sample.slug.split("").reduce<Record<string, number>>((acc, x) => { acc[x] = (acc[x] ?? 0) + 1; return acc; }, {}); expect(Object.values(c).reduce((a, b) => a + b, 0)).toBe(sample.slug.length); });
      it(`slug chars grouped`, () => { const g = sample.slug.split("").reduce((acc: string[], c) => acc.includes(c) ? acc : [...acc, c], []); expect(g.length).toBeLessThanOrEqual(sample.slug.length); });
    });
  }
});
