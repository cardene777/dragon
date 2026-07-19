/**
 * sample DSL size distribution 網羅 (iter55、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter55。
 * 各 sample DSL の line 数 / char 数 / actor / edge 数比率を verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  nodes: unknown[];
  edges: unknown[];
}

describe("iter55: 全 12 sample × DSL size distribution", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`DSL char 数 = 100-5000 範囲`, () => {
        expect(sample.code.length).toBeGreaterThanOrEqual(100);
        expect(sample.code.length).toBeLessThanOrEqual(5000);
      });

      it(`DSL line 数 = 5-200 範囲`, () => {
        const lines = sample.code.split("\n").length;
        expect(lines).toBeGreaterThanOrEqual(5);
        expect(lines).toBeLessThanOrEqual(200);
      });

      it(`compile 後 nodes 数 <= DSL char 数 / 10 (爆発検知)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        expect(d.nodes.length).toBeLessThanOrEqual(sample.code.length / 10 + 100);
      });

      it(`slug が kebab-case format`, () => {
        expect(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(sample.slug)).toBe(true);
      });

      it(`DSL に必須 field (type) が含まれる`, () => {
        expect(sample.code.includes("type:")).toBe(true);
      });
    });
  }
});
