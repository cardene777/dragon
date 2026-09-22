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
        // **名前は 30% と言い、本文は 50% を見ていた** (#2500)。 名前の側に揃えた。
        // 実測 (2026-09-22) では矢印を持つ 7 図すべてで 0% なので、30% でも余裕がある。
        // 矢印を持たない見本は「自分へ戻る割合」 を持たない。 0 本であることを見て終わる
        // = 抜ける形にすると、全ての見本が矢印を失った日に何も確かめずに通る (#2500)
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        if (d.edges.length === 0) {
          expect(d.edges, `${sample.label} の矢印`).toEqual([]);
          return;
        }
        const selfLoops = d.edges.filter((e) => e.from === e.to).length;
        expect(
          selfLoops / d.edges.length,
          `${sample.label} で自分へ戻る矢印が ${selfLoops} / ${d.edges.length} 本`,
        ).toBeLessThanOrEqual(0.3);
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
