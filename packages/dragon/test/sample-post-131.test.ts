import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter132: sample additional 13 axis (JSON safety)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`JSON stringify slug ok`, () => { expect(() => JSON.stringify(sample.slug)).not.toThrow(); });
      it(`JSON stringify label ok`, () => { expect(() => JSON.stringify(sample.label)).not.toThrow(); });
      it(`JSON stringify code ok`, () => { expect(() => JSON.stringify(sample.code)).not.toThrow(); });
      it(`JSON parse slug ok`, () => { const s = JSON.stringify(sample.slug); expect(JSON.parse(s)).toBe(sample.slug); });
      it(`JSON parse label ok`, () => { const s = JSON.stringify(sample.label); expect(JSON.parse(s)).toBe(sample.label); });
      it(`JSON parse code ok`, () => { const s = JSON.stringify(sample.code); expect(JSON.parse(s)).toBe(sample.code); });
      it(`slug JSON starts with dq`, () => { expect(JSON.stringify(sample.slug).startsWith('"')).toBe(true); });
    });
  }
});
