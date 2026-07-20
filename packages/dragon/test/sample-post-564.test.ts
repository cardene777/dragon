import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter565: sample additional (findLast / findLastIndex edge)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`findLast matches last`, () => { expect([1, 2, 3, 4].findLast(x => x % 2 === 0)).toBe(4); });
      it(`findLastIndex`, () => { expect([1, 2, 3, 4].findLastIndex(x => x % 2 === 0)).toBe(3); });
      it(`findLast no match = undefined`, () => { expect([1, 3, 5].findLast(x => x % 2 === 0)).toBeUndefined(); });
      it(`findLastIndex no match = -1`, () => { expect([1, 3, 5].findLastIndex(x => x % 2 === 0)).toBe(-1); });
      it(`findLast empty = undefined`, () => { expect([].findLast(() => true)).toBeUndefined(); });
      it(`findLast index param reverse`, () => { const seen: number[] = []; [10, 20, 30].findLast((_, i) => { seen.push(i); return false; }); expect(seen).toEqual([2, 1, 0]); });
      it(`slug chars findLast`, () => { const chars = sample.slug.split(""); const r = chars.findLast(() => true); if (chars.length > 0) expect(r).toBe(chars[chars.length - 1]); else expect(r).toBeUndefined(); });
    });
  }
});
