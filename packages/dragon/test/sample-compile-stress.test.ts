/**
 * sample compile stress test (iter74、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter74。
 * 各 sample を 50 回連続 compile して型不変性を verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  nodes: unknown[];
  edges: unknown[];
}

describe("iter74: sample compile stress test (50 回連続)", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`50 回 compile で nodes count 不変`, () => {
        const baseline = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (let i = 0; i < 50; i++) {
          const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
          expect(d.nodes.length).toBe(baseline.nodes.length);
        }
      });

      it(`50 回 compile で edges count 不変`, () => {
        const baseline = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (let i = 0; i < 50; i++) {
          const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
          expect(d.edges.length).toBe(baseline.edges.length);
        }
      });

      it(`50 回 compile で 2000ms 未満`, () => {
        const t0 = performance.now();
        for (let i = 0; i < 50; i++) {
          textDslToDiagram(sample.code);
        }
        expect(performance.now() - t0).toBeLessThan(2000);
      });
    });
  }
});
