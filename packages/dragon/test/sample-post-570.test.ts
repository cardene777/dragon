import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter571: sample additional (flatMap / Array.from mapper)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`flatMap double`, () => { expect([1, 2, 3].flatMap(x => [x, x])).toEqual([1, 1, 2, 2, 3, 3]); });
      it(`flatMap empty removes`, () => { expect([1, 2, 3].flatMap(x => x === 2 ? [] : [x])).toEqual([1, 3]); });
      it(`flatMap flattens 1 level only`, () => { expect([1, 2].flatMap(x => [[x]])).toEqual([[1], [2]]); });
      it(`Array.from with mapper`, () => { expect(Array.from([1, 2, 3], x => x * 10)).toEqual([10, 20, 30]); });
      it(`Array.from string with mapper`, () => { expect(Array.from("abc", c => c.toUpperCase())).toEqual(["A", "B", "C"]); });
      it(`Array.from index in mapper`, () => { expect(Array.from({ length: 3 }, (_, i) => i * i)).toEqual([0, 1, 4]); });
      it(`slug from mapper preserves length`, () => { expect(Array.from(sample.slug, c => c).length).toBe(sample.slug.length); });
    });
  }
});
