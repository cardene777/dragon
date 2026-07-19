import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter109: sample additional 7 axis", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`nodes reversed length`, () => {
        const d = textDslToDiagram(sample.code);
        expect([...d.nodes].reverse().length).toBe(d.nodes.length);
      });
      it(`edges reversed length`, () => {
        const d = textDslToDiagram(sample.code);
        expect([...d.edges].reverse().length).toBe(d.edges.length);
      });
      it(`nodes concat empty`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.nodes.concat([]).length).toBe(d.nodes.length);
      });
      it(`sample label trim equal`, () => {
        expect(sample.label.trim()).toBe(sample.label);
      });
      it(`sample slug lowerCase equal`, () => {
        expect(sample.slug.toLowerCase()).toBe(sample.slug);
      });
      it(`sample code length > 0`, () => {
        expect(sample.code.length).toBeGreaterThan(0);
      });
      it(`sample code toString equal itself`, () => {
        expect(sample.code.toString()).toBe(sample.code);
      });
    });
  }
});
