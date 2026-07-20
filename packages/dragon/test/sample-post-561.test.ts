import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter562: sample additional (String.raw / escape)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`String.raw preserves backslash`, () => { expect(String.raw`a\nb`).toBe("a\\nb"); });
      it(`String.raw interpolation`, () => { const x = 5; expect(String.raw`v=${x}`).toBe("v=5"); });
      it(`normal template escapes`, () => { expect(`a\nb`).toBe("a\nb"); });
      it(`String.raw tab`, () => { expect(String.raw`\t`).toBe("\\t"); });
      it(`escaped quote in string`, () => { expect("say \"hi\"").toBe('say "hi"'); });
      it(`hex escape`, () => { expect("\x41").toBe("A"); });
      it(`slug in template literal`, () => { expect(`${sample.slug}`).toBe(sample.slug); });
    });
  }
});
