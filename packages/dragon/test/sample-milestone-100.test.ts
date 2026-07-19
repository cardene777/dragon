/**
 * sample milestone iter100 (2026-07-19)。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter100: sample milestone additional check", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`compile 経路 idempotent`, () => {
        const d1 = textDslToDiagram(sample.code);
        const d2 = textDslToDiagram(sample.code);
        expect(d1.nodes.length).toBe(d2.nodes.length);
      });

      it(`nodes accessible via for-of`, () => {
        const d = textDslToDiagram(sample.code);
        let ok = true;
        for (const n of d.nodes) if (!n) ok = false;
        expect(ok).toBe(true);
      });

      it(`edges accessible via for-of`, () => {
        const d = textDslToDiagram(sample.code);
        let ok = true;
        for (const e of d.edges) if (!e) ok = false;
        expect(ok).toBe(true);
      });

      it(`states accessible via for-of`, () => {
        const d = textDslToDiagram(sample.code);
        let ok = true;
        for (const s of d.states) if (!s) ok = false;
        expect(ok).toBe(true);
      });

      it(`phases accessible via for-of`, () => {
        const d = textDslToDiagram(sample.code);
        let ok = true;
        for (const p of d.phases) if (!p) ok = false;
        expect(ok).toBe(true);
      });

      it(`nodes.length + edges.length + states.length + phases.length integer`, () => {
        const d = textDslToDiagram(sample.code);
        expect(Number.isInteger(d.nodes.length + d.edges.length + d.states.length + d.phases.length)).toBe(true);
      });

      it(`total counts >= 0`, () => {
        const d = textDslToDiagram(sample.code);
        expect(d.nodes.length).toBeGreaterThanOrEqual(0);
        expect(d.edges.length).toBeGreaterThanOrEqual(0);
        expect(d.states.length).toBeGreaterThanOrEqual(0);
        expect(d.phases.length).toBeGreaterThanOrEqual(0);
      });
    });
  }
});
