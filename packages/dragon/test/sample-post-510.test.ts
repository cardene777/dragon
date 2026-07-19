import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

class Bar {
  constructor(public y: string) { /* noop */ }
  echo() { return this.y; }
}

describe("iter511: sample additional (Class basic)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Bar("abc").y = "abc"`, () => { expect(new Bar("abc").y).toBe("abc"); });
      it(`new Bar("abc").echo() = "abc"`, () => { expect(new Bar("abc").echo()).toBe("abc"); });
      it(`new Bar("abc") instanceof Bar`, () => { expect(new Bar("abc") instanceof Bar).toBe(true); });
      it(`Bar.prototype.constructor = Bar`, () => { expect(Bar.prototype.constructor).toBe(Bar); });
      it(`typeof Bar = "function"`, () => { expect(typeof Bar).toBe("function"); });
      it(`Bar.name = "Bar"`, () => { expect(Bar.name).toBe("Bar"); });
      it(`Bar with sample.slug`, () => { expect(new Bar(sample.slug).echo()).toBe(sample.slug); });
    });
  }
});
