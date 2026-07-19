import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter214: sample additional (Object.entries/keys/values)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`Object.keys length = entries length`, () => { expect(Object.keys(sample).length).toBe(Object.entries(sample).length); });
      it(`Object.values length = entries length`, () => { expect(Object.values(sample).length).toBe(Object.entries(sample).length); });
      it(`Object.fromEntries preserves slug`, () => { expect((Object.fromEntries(Object.entries(sample)) as { slug: string }).slug).toBe(sample.slug); });
      it(`Object.fromEntries preserves label`, () => { expect((Object.fromEntries(Object.entries(sample)) as { label: string }).label).toBe(sample.label); });
      it(`Object.keys contains slug/label`, () => { const k = Object.keys(sample); expect(k).toContain("slug"); expect(k).toContain("label"); });
      it(`Object.entries every key is string`, () => { for (const [k] of Object.entries(sample)) expect(typeof k).toBe("string"); });
      it(`Object.keys idempotent`, () => { expect(Object.keys(sample)).toEqual(Object.keys(sample)); });
    });
  }
});
