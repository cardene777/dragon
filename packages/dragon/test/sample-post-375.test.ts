import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter376: sample additional (Iterator protocol)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`slug iterator next has done`, () => { const it = sample.slug[Symbol.iterator](); const r = it.next(); expect(typeof r.done).toBe("boolean"); });
      it(`slug iterator exhausts to done`, () => { const it = sample.slug[Symbol.iterator](); let last = it.next(); while (!last.done) last = it.next(); expect(last.done).toBe(true); });
      it(`label iterator exhausts to done`, () => { const it = sample.label[Symbol.iterator](); let last = it.next(); while (!last.done) last = it.next(); expect(last.done).toBe(true); });
      it(`slug iterator symbol.iterator self`, () => { const it = sample.slug[Symbol.iterator](); expect(typeof it[Symbol.iterator]).toBe("function"); });
      it(`Set iterator done at end`, () => { const s = new Set([1, 2, 3]); const it = s[Symbol.iterator](); let last = it.next(); while (!last.done) last = it.next(); expect(last.done).toBe(true); });
      it(`Map iterator done at end`, () => { const m = new Map([[1, "a"]]); const it = m[Symbol.iterator](); let last = it.next(); while (!last.done) last = it.next(); expect(last.done).toBe(true); });
      it(`gen iterator symbol.iterator self`, () => { function* g() { yield 1; } const gen = g(); expect(gen[Symbol.iterator]()).toBe(gen); });
    });
  }
});
