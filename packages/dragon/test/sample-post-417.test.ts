import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter418: sample additional (crypto.randomUUID/getRandomValues)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`typeof crypto = object`, () => { expect(typeof crypto).toBe("object"); });
      it(`typeof crypto.randomUUID = function`, () => { expect(typeof crypto.randomUUID).toBe("function"); });
      it(`crypto.randomUUID() length = 36`, () => { expect(crypto.randomUUID().length).toBe(36); });
      it(`crypto.randomUUID() has "-"`, () => { expect(crypto.randomUUID()).toContain("-"); });
      it(`two randomUUID != each other`, () => { expect(crypto.randomUUID()).not.toBe(crypto.randomUUID()); });
      it(`typeof crypto.getRandomValues = function`, () => { expect(typeof crypto.getRandomValues).toBe("function"); });
      it(`crypto.getRandomValues fills buffer`, () => { const buf = new Uint8Array(16); crypto.getRandomValues(buf); expect(buf.length).toBe(16); });
    });
  }
});
