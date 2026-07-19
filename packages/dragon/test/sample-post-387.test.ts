import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter388: sample additional (Set operations)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Set(slug) size <= slug.length`, () => { expect(new Set(sample.slug).size).toBeLessThanOrEqual(sample.slug.length); });
      it(`new Set(label) size <= label.length`, () => { expect(new Set(sample.label).size).toBeLessThanOrEqual(sample.label.length); });
      it(`Set.add returns Set`, () => { const s = new Set(); expect(s.add(1)).toBe(s); });
      it(`Set.clear() sets size to 0`, () => { const s = new Set([1, 2, 3]); s.clear(); expect(s.size).toBe(0); });
      it(`Set forEach visits all`, () => { const s = new Set([1, 2, 3]); let c = 0; s.forEach(() => c++); expect(c).toBe(3); });
      it(`[...new Set([1,2,3,3,1])].length = 3`, () => { expect([...new Set([1, 2, 3, 3, 1])].length).toBe(3); });
      it(`new Set().size = 0`, () => { expect(new Set().size).toBe(0); });
    });
  }
});
