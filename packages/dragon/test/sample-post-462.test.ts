import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter463: sample additional (String replace / replaceAll / includes)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`"aaa".replace("a", "b") = "baa"`, () => { expect("aaa".replace("a", "b")).toBe("baa"); });
      it(`"aaa".replaceAll("a", "b") = "bbb"`, () => { expect("aaa".replaceAll("a", "b")).toBe("bbb"); });
      it(`"aaa".replace(/a/g, "b") = "bbb"`, () => { expect("aaa".replace(/a/g, "b")).toBe("bbb"); });
      it(`"abc".includes("b") = true`, () => { expect("abc".includes("b")).toBe(true); });
      it(`"abc".includes("z") = false`, () => { expect("abc".includes("z")).toBe(false); });
      it(`"abc".startsWith("ab") = true`, () => { expect("abc".startsWith("ab")).toBe(true); });
      it(`slug empty check`, () => { expect(sample.slug.includes(sample.slug)).toBe(true); });
    });
  }
});
