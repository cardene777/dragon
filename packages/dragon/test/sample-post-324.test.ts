import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter325: sample additional (WeakMap/WeakSet)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`new WeakMap has sample`, () => { const wm = new WeakMap(); wm.set(sample, 1); expect(wm.has(sample)).toBe(true); });
      it(`new WeakMap get returns value`, () => { const wm = new WeakMap(); wm.set(sample, sample.slug); expect(wm.get(sample)).toBe(sample.slug); });
      it(`new WeakMap delete returns true`, () => { const wm = new WeakMap(); wm.set(sample, 1); expect(wm.delete(sample)).toBe(true); });
      it(`new WeakSet has sample`, () => { const ws = new WeakSet(); ws.add(sample); expect(ws.has(sample)).toBe(true); });
      it(`new WeakSet delete returns true`, () => { const ws = new WeakSet(); ws.add(sample); expect(ws.delete(sample)).toBe(true); });
      it(`WeakMap has empty return false`, () => { const wm = new WeakMap(); expect(wm.has(sample)).toBe(false); });
      it(`WeakSet has empty return false`, () => { const ws = new WeakSet(); expect(ws.has(sample)).toBe(false); });
    });
  }
});
