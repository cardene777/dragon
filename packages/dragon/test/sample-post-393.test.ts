import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter394: sample additional (Proxy basics)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new Proxy(s, {}).slug = slug`, () => { const p = new Proxy(sample, {}); expect(p.slug).toBe(sample.slug); });
      it(`new Proxy(s, {}).label = label`, () => { const p = new Proxy(sample, {}); expect(p.label).toBe(sample.label); });
      it(`new Proxy(s, {get: () => "X"}).slug = X`, () => { const p = new Proxy(sample, { get() { return "X"; } }); expect(p.slug).toBe("X"); });
      it(`Proxy has behavior`, () => { const p = new Proxy(sample, { has() { return true; } }); expect("nonexist" in p).toBe(true); });
      it(`Proxy.revocable revokes`, () => { const r = Proxy.revocable(sample, {}); expect(r.proxy.slug).toBe(sample.slug); r.revoke(); });
      it(`typeof Proxy = function`, () => { expect(typeof Proxy).toBe("function"); });
      it(`Proxy handler noop`, () => { const p = new Proxy(sample, {}); expect(Object.keys(p).length).toBe(Object.keys(sample).length); });
    });
  }
});
