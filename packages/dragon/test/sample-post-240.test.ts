import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter241: sample additional (Object.assign / spread)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Object.assign({}, s).slug = slug`, () => { expect(Object.assign({} as typeof sample, sample).slug).toBe(sample.slug); });
      it(`Object.assign({}, s).label = label`, () => { expect(Object.assign({} as typeof sample, sample).label).toBe(sample.label); });
      it(`{...s}.slug = slug`, () => { expect(({ ...sample }).slug).toBe(sample.slug); });
      it(`{...s}.label = label`, () => { expect(({ ...sample }).label).toBe(sample.label); });
      it(`{...s, extra: 1}.extra = 1`, () => { expect(({ ...sample, extra: 1 }).extra).toBe(1); });
      it(`Object.assign preserves key count`, () => { expect(Object.keys(Object.assign({} as typeof sample, sample)).length).toBe(Object.keys(sample).length); });
      it(`{...s} not = s ref`, () => { expect(({ ...sample })).not.toBe(sample); });
    });
  }
});
