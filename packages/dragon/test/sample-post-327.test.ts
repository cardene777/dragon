import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter328: sample additional (destructure/rest/spread)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`{slug} = sample = slug`, () => { const { slug } = sample; expect(slug).toBe(sample.slug); });
      it(`{label} = sample = label`, () => { const { label } = sample; expect(label).toBe(sample.label); });
      it(`{...rest} of sample preserves keys`, () => { const { ...rest } = sample; expect(Object.keys(rest).length).toBe(Object.keys(sample).length); });
      it(`[first, ...rest] of slug split`, () => { if (sample.slug.length) { const [first, ...rest] = sample.slug.split(""); expect(first).toBe(sample.slug[0]); expect(rest.length).toBe(sample.slug.length - 1); } });
      it(`[first] of label split`, () => { if (sample.label.length) { const [first] = sample.label.split(""); expect(first).toBe(sample.label[0]); } });
      it(`{slug: a} = sample = slug renamed`, () => { const { slug: a } = sample; expect(a).toBe(sample.slug); });
      it(`{label: b} = sample = label renamed`, () => { const { label: b } = sample; expect(b).toBe(sample.label); });
    });
  }
});
