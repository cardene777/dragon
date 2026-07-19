import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter358: sample additional (JSON replacer/reviver)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`JSON.stringify with null replacer = default`, () => { expect(JSON.stringify(sample, null)).toBe(JSON.stringify(sample)); });
      it(`JSON.stringify with [] whitelist = "{}"`, () => { expect(JSON.stringify(sample, [])).toBe("{}"); });
      it(`JSON.stringify with ["slug"] contains slug`, () => { expect(JSON.stringify(sample, ["slug"])).toContain(sample.slug); });
      it(`JSON.stringify with ["label"] contains label`, () => { expect(JSON.stringify(sample, ["label"])).toContain(sample.label); });
      it(`JSON.parse reviver preserves value`, () => { const r = JSON.parse(JSON.stringify(sample), (_, v) => v); expect(r.slug).toBe(sample.slug); });
      it(`JSON.parse reviver skip = undefined`, () => { const r = JSON.parse('{"a":1,"b":2}', (k, v) => k === "a" ? undefined : v); expect(r).toEqual({ b: 2 }); });
      it(`JSON.stringify indent "  " has 2-space`, () => { expect(JSON.stringify(sample, null, "  ")).toContain("  "); });
    });
  }
});
