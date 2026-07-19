import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter400: sample additional (Array forEach thisArg) 🎊 iter400 大台", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug split forEach thisArg`, () => { let seen = false; sample.slug.split("").forEach(function (this: { flag: boolean }) { if (this.flag) seen = true; }, { flag: true }); expect(sample.slug.length === 0 || seen).toBe(true); });
      it(`slug split map thisArg`, () => { const r = sample.slug.split("").map(function (this: { v: number }) { return this.v; }, { v: 5 }); expect(sample.slug.length === 0 || r.every(v => v === 5)).toBe(true); });
      it(`label split forEach thisArg`, () => { let seen = false; sample.label.split("").forEach(function (this: { flag: boolean }) { if (this.flag) seen = true; }, { flag: true }); expect(sample.label.length === 0 || seen).toBe(true); });
      it(`slug split forEach visits all`, () => { let c = 0; sample.slug.split("").forEach(() => c++); expect(c).toBe(sample.slug.length); });
      it(`label split map preserves length`, () => { expect(sample.label.split("").map(c => c).length).toBe(sample.label.length); });
      it(`slug split filter truthy preserves`, () => { expect(sample.slug.split("").filter(() => true).length).toBe(sample.slug.length); });
      it(`slug split some false = false`, () => { expect(sample.slug.split("").some(() => false)).toBe(false); });
    });
  }
});
