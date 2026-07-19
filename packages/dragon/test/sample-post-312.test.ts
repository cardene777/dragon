import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter313: sample additional (Date basics)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Date(0) is Date`, () => { expect(new Date(0) instanceof Date).toBe(true); });
      it(`new Date(0).getTime = 0`, () => { expect(new Date(0).getTime()).toBe(0); });
      it(`new Date(0).toISOString contains T`, () => { expect(new Date(0).toISOString()).toContain("T"); });
      it(`new Date(0).getUTCFullYear = 1970`, () => { expect(new Date(0).getUTCFullYear()).toBe(1970); });
      it(`Date.parse("1970-01-01Z") = 0`, () => { expect(Date.parse("1970-01-01Z")).toBe(0); });
      it(`new Date(0).valueOf = 0`, () => { expect(new Date(0).valueOf()).toBe(0); });
      it(`Number(new Date(0)) = 0`, () => { expect(Number(new Date(0))).toBe(0); });
    });
  }
});
