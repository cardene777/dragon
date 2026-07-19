import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter409: sample additional (btoa/atob base64)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`btoa("abc") = "YWJj"`, () => { expect(btoa("abc")).toBe("YWJj"); });
      it(`atob("YWJj") = "abc"`, () => { expect(atob("YWJj")).toBe("abc"); });
      it(`atob(btoa("hello")) = "hello"`, () => { expect(atob(btoa("hello"))).toBe("hello"); });
      it(`btoa("") = ""`, () => { expect(btoa("")).toBe(""); });
      it(`atob("") = ""`, () => { expect(atob("")).toBe(""); });
      it(`typeof btoa = function`, () => { expect(typeof btoa).toBe("function"); });
      it(`typeof atob = function`, () => { expect(typeof atob).toBe("function"); });
    });
  }
});
