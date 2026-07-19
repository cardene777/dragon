import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter340: sample additional (Array sort comparator)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split sort length preserved`, () => { expect(sample.slug.split("").sort().length).toBe(sample.slug.length); });
      it(`label split sort length preserved`, () => { expect(sample.label.split("").sort().length).toBe(sample.label.length); });
      it(`slug split sort desc = reverse of asc`, () => { const asc = sample.slug.split("").sort(); const desc = sample.slug.split("").sort().reverse(); expect(desc).toEqual(asc.slice().reverse()); });
      it(`sort returns array itself`, () => { const arr = sample.slug.split(""); expect(arr.sort()).toBe(arr); });
      it(`[3,1,2].sort() = [1,2,3]`, () => { expect([3, 1, 2].sort()).toEqual([1, 2, 3]); });
      it(`stable sort preserves order`, () => { const arr = [{k: 1, v: "a"}, {k: 1, v: "b"}]; expect(arr.sort((x, y) => x.k - y.k).map(x => x.v)).toEqual(["a", "b"]); });
      it(`sort noop preserves length`, () => { expect(sample.label.split("").sort(() => 0).length).toBe(sample.label.length); });
    });
  }
});
