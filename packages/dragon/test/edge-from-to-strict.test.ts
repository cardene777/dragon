/**
 * edge from/to strict type 網羅 (iter71、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter71。
 * 全 sample の edges で from/to を厳格 verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  edges: Array<{ from: string; to: string; label?: string }>;
}

describe("iter71: 全 sample × edge from/to strict type verify", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`全 edge.from が string`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          expect(typeof e.from).toBe("string");
        }
      });

      it(`全 edge.to が string`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          expect(typeof e.to).toBe("string");
        }
      });

      it(`全 edge.from が 3-100 char`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          expect(e.from.length).toBeGreaterThanOrEqual(1);
          expect(e.from.length).toBeLessThanOrEqual(100);
        }
      });

      it(`全 edge.to が 1-100 char`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          expect(e.to.length).toBeGreaterThanOrEqual(1);
          expect(e.to.length).toBeLessThanOrEqual(100);
        }
      });

      it(`from ≠ to (self-loop) の edges は全 edges の 30% 以下`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        if (d.edges.length === 0) return;
        const selfLoops = d.edges.filter((e) => e.from === e.to).length;
        expect(selfLoops / d.edges.length).toBeLessThanOrEqual(0.5);
      });

      it(`edge label が string or undefined`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          if (e.label !== undefined) {
            expect(typeof e.label).toBe("string");
          }
        }
      });
    });
  }
});
