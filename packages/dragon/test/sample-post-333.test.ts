import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter334: sample additional (Nullish/Optional chaining)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug ?? "def" = slug`, () => { expect(sample.slug ?? "def").toBe(sample.slug); });
      it(`label ?? "def" = label`, () => { expect(sample.label ?? "def").toBe(sample.label); });
      it(`null ?? slug = slug`, () => { expect((null as string | null) ?? sample.slug).toBe(sample.slug); });
      it(`undefined ?? label = label`, () => { expect((undefined as string | undefined) ?? sample.label).toBe(sample.label); });
      it(`sample?.slug = slug`, () => { expect(sample?.slug).toBe(sample.slug); });
      it(`sample?.label = label`, () => { expect(sample?.label).toBe(sample.label); });
      it(`undefined?.slug = undefined`, () => { const u: undefined | typeof sample = undefined; expect(u?.slug).toBeUndefined(); });
    });
  }
});
