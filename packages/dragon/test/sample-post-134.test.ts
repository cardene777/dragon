import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter135: sample additional 14 axis (Object shape)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`is object`, () => { expect(typeof sample).toBe("object"); });
      it(`not null`, () => { expect(sample).not.toBeNull(); });
      it(`has slug own`, () => { expect(Object.prototype.hasOwnProperty.call(sample, "slug")).toBe(true); });
      it(`has label own`, () => { expect(Object.prototype.hasOwnProperty.call(sample, "label")).toBe(true); });
      it(`has code own`, () => { expect(Object.prototype.hasOwnProperty.call(sample, "code")).toBe(true); });
      it(`keys include slug`, () => { expect(Object.keys(sample)).toContain("slug"); });
      it(`keys include label`, () => { expect(Object.keys(sample)).toContain("label"); });
    });
  }
});
