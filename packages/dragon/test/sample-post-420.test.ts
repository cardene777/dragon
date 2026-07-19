import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter421: sample additional (performance.now/Date.now)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`typeof Date.now = function`, () => { expect(typeof Date.now).toBe("function"); });
      it(`Date.now() > 0`, () => { expect(Date.now()).toBeGreaterThan(0); });
      it(`typeof performance = object`, () => { expect(typeof performance).toBe("object"); });
      it(`typeof performance.now = function`, () => { expect(typeof performance.now).toBe("function"); });
      it(`performance.now() >= 0`, () => { expect(performance.now()).toBeGreaterThanOrEqual(0); });
      it(`Date.now() < Date.now() + 1000`, () => { expect(Date.now()).toBeLessThan(Date.now() + 1000); });
      it(`performance.now() < performance.now() + 100`, () => { expect(performance.now()).toBeLessThan(performance.now() + 100); });
    });
  }
});
