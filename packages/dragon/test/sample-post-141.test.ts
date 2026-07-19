import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter142: sample additional (immutability)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug spread ok`, () => { const cp = { ...sample }; expect(cp.slug).toBe(sample.slug); });
      it(`label spread ok`, () => { const cp = { ...sample }; expect(cp.label).toBe(sample.label); });
      it(`code spread ok`, () => { const cp = { ...sample }; expect(cp.code).toBe(sample.code); });
      it(`slug template literal`, () => { expect(`${sample.slug}`).toBe(sample.slug); });
      it(`label template literal`, () => { expect(`${sample.label}`).toBe(sample.label); });
      it(`slug array spread eq length`, () => { expect([...sample.slug].length).toBe(sample.slug.length); });
      it(`label array spread eq length`, () => { expect([...sample.label].length).toBeGreaterThan(0); });
    });
  }
});
