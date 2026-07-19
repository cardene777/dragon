import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter460: sample additional (String slice / substring)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`"hello".slice(1, 3) = "el"`, () => { expect("hello".slice(1, 3)).toBe("el"); });
      it(`"hello".slice(-2) = "lo"`, () => { expect("hello".slice(-2)).toBe("lo"); });
      it(`"hello".slice(1) = "ello"`, () => { expect("hello".slice(1)).toBe("ello"); });
      it(`"hello".substring(1, 3) = "el"`, () => { expect("hello".substring(1, 3)).toBe("el"); });
      it(`"hello".substring(-1) = "hello"`, () => { expect("hello".substring(-1)).toBe("hello"); });
      it(`"".slice(0, 10) = ""`, () => { expect("".slice(0, 10)).toBe(""); });
      it(`slug.slice(0) = slug`, () => { expect(sample.slug.slice(0)).toBe(sample.slug); });
    });
  }
});
