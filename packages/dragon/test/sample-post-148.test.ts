import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter149: sample additional (Map/Set)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug as Map key`, () => { const m = new Map(); m.set(sample.slug, 1); expect(m.get(sample.slug)).toBe(1); });
      it(`slug in Set`, () => { const s = new Set([sample.slug]); expect(s.has(sample.slug)).toBe(true); });
      it(`label as Map key`, () => { const m = new Map(); m.set(sample.label, 1); expect(m.get(sample.label)).toBe(1); });
      it(`label in Set`, () => { const s = new Set([sample.label]); expect(s.has(sample.label)).toBe(true); });
      it(`slug set size 1`, () => { expect(new Set([sample.slug]).size).toBe(1); });
      it(`label set size 1`, () => { expect(new Set([sample.label]).size).toBe(1); });
      it(`code Map has`, () => { const m = new Map([[sample.code, true]]); expect(m.has(sample.code)).toBe(true); });
    });
  }
});
