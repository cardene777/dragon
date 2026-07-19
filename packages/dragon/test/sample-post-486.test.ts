import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter487: sample additional (Map basic)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Map([["a", 1]]).get("a") = 1`, () => { expect(new Map([["a", 1]]).get("a")).toBe(1); });
      it(`new Map().set("a", 1).get("a") = 1`, () => { expect(new Map().set("a", 1).get("a")).toBe(1); });
      it(`new Map([["a", 1]]).has("a") = true`, () => { expect(new Map([["a", 1]]).has("a")).toBe(true); });
      it(`new Map([["a", 1]]).size = 1`, () => { expect(new Map([["a", 1]]).size).toBe(1); });
      it(`new Map().get("x") = undefined`, () => { expect(new Map().get("x")).toBeUndefined(); });
      it(`new Map([["a", 1]]).delete("a") = true`, () => { expect(new Map([["a", 1]]).delete("a")).toBe(true); });
      it(`slug -> Map preserves`, () => { const m = new Map([[sample.slug, sample.label]]); expect(m.get(sample.slug)).toBe(sample.label); });
    });
  }
});
