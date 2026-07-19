import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter406: sample additional (URL/URLSearchParams)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new URL(https://a.com).href = "https://a.com/"`, () => { expect(new URL("https://a.com").href).toBe("https://a.com/"); });
      it(`new URL(https://a.com/x).pathname = /x`, () => { expect(new URL("https://a.com/x").pathname).toBe("/x"); });
      it(`new URLSearchParams("a=1").get("a") = "1"`, () => { expect(new URLSearchParams("a=1").get("a")).toBe("1"); });
      it(`new URLSearchParams("a=1&b=2").size = 2`, () => { expect(new URLSearchParams("a=1&b=2").size).toBe(2); });
      it(`URLSearchParams append/get`, () => { const p = new URLSearchParams(); p.append("k", "v"); expect(p.get("k")).toBe("v"); });
      it(`URLSearchParams has/delete`, () => { const p = new URLSearchParams("a=1"); expect(p.has("a")).toBe(true); p.delete("a"); expect(p.has("a")).toBe(false); });
      it(`URL protocol https:`, () => { expect(new URL("https://a.com").protocol).toBe("https:"); });
    });
  }
});
