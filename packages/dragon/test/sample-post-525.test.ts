import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter526: sample additional (URL)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new URL host`, () => { expect(new URL("https://a.com/x").host).toBe("a.com"); });
      it(`new URL protocol`, () => { expect(new URL("https://a.com").protocol).toBe("https:"); });
      it(`new URL pathname`, () => { expect(new URL("https://a.com/foo/bar").pathname).toBe("/foo/bar"); });
      it(`new URL search`, () => { expect(new URL("https://a.com?a=1&b=2").search).toBe("?a=1&b=2"); });
      it(`new URL hash`, () => { expect(new URL("https://a.com#top").hash).toBe("#top"); });
      it(`invalid URL throws`, () => { expect(() => new URL("not a url")).toThrow(); });
      it(`URL encode slug`, () => { expect(encodeURIComponent(sample.slug)).toContain(encodeURIComponent(sample.slug[0])); });
    });
  }
});
