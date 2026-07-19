import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter502: sample additional (typeof / instanceof)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`typeof "abc" = "string"`, () => { expect(typeof "abc").toBe("string"); });
      it(`typeof 42 = "number"`, () => { expect(typeof 42).toBe("number"); });
      it(`typeof true = "boolean"`, () => { expect(typeof true).toBe("boolean"); });
      it(`typeof undefined = "undefined"`, () => { expect(typeof undefined).toBe("undefined"); });
      it(`typeof null = "object"`, () => { expect(typeof null).toBe("object"); });
      it(`typeof function(){} = "function"`, () => { expect(typeof function () { /* noop */ }).toBe("function"); });
      it(`[] instanceof Array = true`, () => { expect([] instanceof Array).toBe(true); });
      it(`typeof sample.slug = "string"`, () => { expect(typeof sample.slug).toBe("string"); });
    });
  }
});
