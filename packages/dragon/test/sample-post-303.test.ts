import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

class SampleWrapper {
  constructor(public s: (typeof EDITOR_SAMPLES)[number]) {}
  getSlug() { return this.s.slug; }
  getLabel() { return this.s.label; }
}

describe("iter304: sample additional (Class/new instance)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new SampleWrapper is SampleWrapper`, () => { expect(new SampleWrapper(sample) instanceof SampleWrapper).toBe(true); });
      it(`new SampleWrapper.s = sample`, () => { expect(new SampleWrapper(sample).s).toBe(sample); });
      it(`new SampleWrapper.getSlug() = slug`, () => { expect(new SampleWrapper(sample).getSlug()).toBe(sample.slug); });
      it(`new SampleWrapper.getLabel() = label`, () => { expect(new SampleWrapper(sample).getLabel()).toBe(sample.label); });
      it(`SampleWrapper.name = SampleWrapper`, () => { expect(SampleWrapper.name).toBe("SampleWrapper"); });
      it(`new instances not = same ref`, () => { expect(new SampleWrapper(sample)).not.toBe(new SampleWrapper(sample)); });
      it(`instance constructor = SampleWrapper`, () => { expect(new SampleWrapper(sample).constructor).toBe(SampleWrapper); });
    });
  }
});
