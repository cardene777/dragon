/**
 * sample post-iter100 milestone check (iter102、 2026-07-19)。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter102: 全 12 sample × extra invariants (post-100)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`diagram truthy`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d).toBeTruthy();
      });

      it(`nodes truthy`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.nodes).toBeTruthy();
      });

      it(`edges truthy`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.edges).toBeTruthy();
      });

      it(`states truthy`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.states).toBeTruthy();
      });

      it(`phases truthy`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.phases).toBeTruthy();
      });

      it(`Object.values(d).length > 0`, () => {
        const d = textDslToDiagram(sample.code);
        expect(Object.values(d).length).toBeGreaterThan(0);
      });

      it(`Object.entries(d).length > 0`, () => {
        const d = textDslToDiagram(sample.code);
        expect(Object.entries(d).length).toBeGreaterThan(0);
      });
    });
  }
});
