import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter226: sample additional (JSON round-trip)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`JSON parse stringify slug`, () => { expect(JSON.parse(JSON.stringify(sample)).slug).toBe(sample.slug); });
      it(`JSON parse stringify label`, () => { expect(JSON.parse(JSON.stringify(sample)).label).toBe(sample.label); });
      it(`JSON stringify is string`, () => { expect(typeof JSON.stringify(sample)).toBe("string"); });
      it(`JSON stringify not empty`, () => { expect(JSON.stringify(sample).length).toBeGreaterThan(0); });
      it(`JSON stringify starts with {`, () => { expect(JSON.stringify(sample).startsWith("{")).toBe(true); });
      it(`JSON stringify ends with }`, () => { expect(JSON.stringify(sample).endsWith("}")).toBe(true); });
      it(`JSON parse stringify sample = deep equal`, () => { expect(JSON.parse(JSON.stringify(sample))).toEqual(sample); });
    });
  }
});
