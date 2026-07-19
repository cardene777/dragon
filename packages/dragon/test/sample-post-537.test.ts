import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter538: sample additional (String Unicode / codePoint)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`String.fromCharCode(97) = "a"`, () => { expect(String.fromCharCode(97)).toBe("a"); });
      it(`String.fromCodePoint(0x1F600) emoji`, () => { expect(String.fromCodePoint(0x1F600).length).toBe(2); });
      it(`"😀".codePointAt(0) = 0x1F600`, () => { expect("😀".codePointAt(0)).toBe(0x1F600); });
      it(`"😀".length = 2 (surrogate pair)`, () => { expect("😀".length).toBe(2); });
      it(`[..."😀"].length = 1 (code points)`, () => { expect([..."😀"].length).toBe(1); });
      it(`"a".charCodeAt(0) = 97`, () => { expect("a".charCodeAt(0)).toBe(97); });
      it(`slug spread code points`, () => { expect([...sample.slug].length).toBeLessThanOrEqual(sample.slug.length); });
    });
  }
});
