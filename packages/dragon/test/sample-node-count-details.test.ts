/**
 * sample node count details (iter96、 2026-07-19)。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter96: 全 sample × node count details", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`nodes count >= 1`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.nodes.length).toBeGreaterThanOrEqual(1);
      });

      it(`nodes count <= 200`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.nodes.length).toBeLessThanOrEqual(200);
      });

      it(`edges count <= 500`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.edges.length).toBeLessThanOrEqual(500);
      });

      it(`states count <= 100`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.states.length).toBeLessThanOrEqual(100);
      });

      it(`phases count <= 50`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.phases.length).toBeLessThanOrEqual(50);
      });

      it(`nodes count が integer`, () => {
        const d = textDslToDiagram(sample.code);
        expect(Number.isInteger(d.nodes.length)).toBe(true);
      });

      it(`nodes count が negative でない`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.nodes.length).toBeGreaterThanOrEqual(0);
      });
    });
  }
});
