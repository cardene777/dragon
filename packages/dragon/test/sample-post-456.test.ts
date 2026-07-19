import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter457: sample additional (join / toString / concat)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`[1,2,3].join("-") = "1-2-3"`, () => { expect([1, 2, 3].join("-")).toBe("1-2-3"); });
      it(`[1,2,3].join() = "1,2,3"`, () => { expect([1, 2, 3].join()).toBe("1,2,3"); });
      it(`[].join(",") = ""`, () => { expect([].join(",")).toBe(""); });
      it(`[1,2,3].toString() = "1,2,3"`, () => { expect([1, 2, 3].toString()).toBe("1,2,3"); });
      it(`[1,2].concat([3,4]) = [1,2,3,4]`, () => { expect([1, 2].concat([3, 4])).toEqual([1, 2, 3, 4]); });
      it(`[1,2].concat(3, 4) = [1,2,3,4]`, () => { expect([1, 2].concat(3, 4)).toEqual([1, 2, 3, 4]); });
      it(`slug.split("").join("") = slug`, () => { expect(sample.slug.split("").join("")).toBe(sample.slug); });
    });
  }
});
