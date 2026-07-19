import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter229: sample additional (Set/Map)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Set([slug]) has slug`, () => { expect(new Set([sample.slug]).has(sample.slug)).toBe(true); });
      it(`new Set([label]) has label`, () => { expect(new Set([sample.label]).has(sample.label)).toBe(true); });
      it(`new Set([slug, slug]) size = 1`, () => { expect(new Set([sample.slug, sample.slug]).size).toBe(1); });
      it(`new Set(slug chars) size <= slug length`, () => { expect(new Set(sample.slug.split("")).size).toBeLessThanOrEqual(sample.slug.length); });
      it(`new Map set/get slug value`, () => { const m = new Map(); m.set(sample.slug, "v"); expect(m.get(sample.slug)).toBe("v"); });
      it(`new Map size after delete = 0`, () => { const m = new Map(); m.set(sample.slug, "v"); m.delete(sample.slug); expect(m.size).toBe(0); });
      it(`new WeakSet with sample obj has obj`, () => { const w = new WeakSet(); w.add(sample); expect(w.has(sample)).toBe(true); });
    });
  }
});
