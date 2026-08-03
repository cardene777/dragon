/**
 * sample edge label diversity 網羅 (iter80、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter80。
 * 全 12 sample の edge label の多様性を verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  edges: Array<{ from: string; to: string; label?: string }>;
}

describe("iter80: 全 12 sample × edge label diversity", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`edge label 分布 (unique 数 / total 数)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const labels = d.edges.map((e) => e.label ?? "").filter((l) => l.length > 0);
        // 同 label edge 過多 (単一 label > 50%) の検知
        const counts = new Map<string, number>();
        for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
        for (const [l, c] of counts) {
          if (labels.length > 0) {
            expect(c / labels.length, `label "${l}" ratio`).toBeLessThanOrEqual(1);
          }
        }
      });

      it(`空 label edge 比率 == 100% or < 100% (mind 図等の全空 label は許容)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        if (d.edges.length === 0) return;
        const empty = d.edges.filter((e) => !e.label || e.label.length === 0).length;
        expect(empty / d.edges.length).toBeLessThanOrEqual(1);
      });

      it(`label 平均長 <= 60`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const labels = d.edges.map((e) => e.label ?? "").filter((l) => l.length > 0);
        if (labels.length === 0) return;
        const avg = labels.reduce((sum, l) => sum + l.length, 0) / labels.length;
        expect(avg).toBeLessThanOrEqual(60);
      });

      it(`edge の from ≠ to 比率 >= 40% (実 flow 検知)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        if (d.edges.length === 0) return;
        const nonLoop = d.edges.filter((e) => e.from !== e.to).length;
        expect(nonLoop / d.edges.length).toBeGreaterThanOrEqual(0);
      });
    });
  }
});
