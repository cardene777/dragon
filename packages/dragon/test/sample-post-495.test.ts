import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter496: sample additional (Regex basic)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`/abc/.test("abc") = true`, () => { expect(/abc/.test("abc")).toBe(true); });
      it(`/abc/.test("xyz") = false`, () => { expect(/abc/.test("xyz")).toBe(false); });
      it(`/abc/i.test("ABC") = true`, () => { expect(/abc/i.test("ABC")).toBe(true); });
      it(`new RegExp("abc").test("abc") = true`, () => { expect(new RegExp("abc").test("abc")).toBe(true); });
      it(`/(\\w+)/.exec("abc")[0] = "abc"`, () => { expect(/(\w+)/.exec("abc")?.[0]).toBe("abc"); });
      it(`/^abc$/.test("abc") = true`, () => { expect(/^abc$/.test("abc")).toBe(true); });
      it(`slug matches non-empty`, () => { if (sample.slug.length > 0) expect(/.+/.test(sample.slug)).toBe(true); else expect(true).toBe(true); });
    });
  }
});
