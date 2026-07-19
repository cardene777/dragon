import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter256: sample additional (Array forEach)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split forEach visits all`, () => { let c = 0; sample.slug.split("").forEach(() => c++); expect(c).toBe(sample.slug.length); });
      it(`slug split forEach returns undefined`, () => { expect(sample.slug.split("").forEach(() => {})).toBeUndefined(); });
      it(`label split forEach visits all`, () => { let c = 0; sample.label.split("").forEach(() => c++); expect(c).toBe(sample.label.length); });
      it(`label split forEach returns undefined`, () => { expect(sample.label.split("").forEach(() => {})).toBeUndefined(); });
      it(`slug split forEach passes index seq`, () => { const idx: number[] = []; sample.slug.split("").forEach((_, i) => idx.push(i)); expect(idx).toEqual(sample.slug.split("").map((_, i) => i)); });
      it(`slug split forEach doesn't modify`, () => { const arr = sample.slug.split(""); const before = arr.length; arr.forEach(() => {}); expect(arr.length).toBe(before); });
      it(`slug split forEach passes array as 3rd arg`, () => { const arr = sample.slug.split(""); let a: unknown = null; arr.forEach((_, __, r) => { a = r; }); if (arr.length) expect(a).toBe(arr); });
    });
  }
});
