import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter208: sample additional (find/findIndex/includes)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split findIndex never = -1`, () => { expect(sample.slug.split("").findIndex(() => false)).toBe(-1); });
      it(`slug split find never = undefined`, () => { expect(sample.slug.split("").find(() => false)).toBeUndefined(); });
      it(`label split findIndex never = -1`, () => { expect(sample.label.split("").findIndex(() => false)).toBe(-1); });
      it(`slug split includes non-member = false`, () => { expect(sample.slug.split("").includes("\u{200B}")).toBe(false); });
      it(`label split includes non-member = false`, () => { expect(sample.label.split("").includes("\u{200B}")).toBe(false); });
      it(`slug split indexOf non-member = -1`, () => { expect(sample.slug.split("").indexOf("\u{200B}")).toBe(-1); });
      it(`label split indexOf non-member = -1`, () => { expect(sample.label.split("").indexOf("\u{200B}")).toBe(-1); });
    });
  }
});
