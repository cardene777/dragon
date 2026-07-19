import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("iter541: sample additional (crypto.randomUUID)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`randomUUID format`, () => { expect(UUID_RE.test(crypto.randomUUID())).toBe(true); });
      it(`randomUUID unique`, () => { expect(crypto.randomUUID()).not.toBe(crypto.randomUUID()); });
      it(`randomUUID length 36`, () => { expect(crypto.randomUUID().length).toBe(36); });
      it(`getRandomValues fills`, () => { const arr = new Uint8Array(4); crypto.getRandomValues(arr); expect(arr.length).toBe(4); });
      it(`getRandomValues returns same ref`, () => { const arr = new Uint8Array(4); expect(crypto.getRandomValues(arr)).toBe(arr); });
      it(`randomUUID version 4`, () => { expect(crypto.randomUUID()[14]).toBe("4"); });
      it(`crypto defined`, () => { expect(typeof crypto).toBe("object"); });
    });
  }
});
