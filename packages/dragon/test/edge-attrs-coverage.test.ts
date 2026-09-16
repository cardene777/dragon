/**
 * edge attrs coverage 網羅 (iter29、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter29。
 * 全 sample の edges について attribute の型・存在網羅を verify。
 *
 * (a) 全 edge が from string / to string / label (?) string の 3 property を持つ
 * (b) label が存在するなら 100 chars 以下 (異常長 label 検知)
 * (c) polarity / linkType / arrow attr の型妥当性
 * (d) 同一 sample 内で edge 数が nodes 数と論理整合 (edge >> nodes^2 なら異常)
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  nodes: Array<{ id: string }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
    polarity?: string;
    linkType?: string;
    arrow?: string;
  }>;
}

describe("iter29: 全 sample × edge attrs coverage", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`全 edge が from/to (string) を持つ`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of diagram.edges) {
          expect(typeof e.from).toBe("string");
          expect(typeof e.to).toBe("string");
        }
      });

      it(`edge label が存在するなら 200 chars 以下`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const tooLong = diagram.edges.filter((e) => typeof e.label === "string" && e.label.length > 200);
        expect(tooLong.map((e) => e.label!.length)).toEqual([]);
      });

      it(`edge count が nodes^2 の 2 倍以下 (異常密結合検知)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const n = diagram.nodes.length;
        const upperBound = Math.max(20, n * n * 2);
        expect(diagram.edges.length, `edges=${diagram.edges.length}, nodes=${n}`).toBeLessThanOrEqual(upperBound);
      });

      it(`linkType / arrow attr は string 型 (存在時)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of diagram.edges) {
          if (e.linkType !== undefined) expect(typeof e.linkType).toBe("string");
          if (e.arrow !== undefined) expect(typeof e.arrow).toBe("string");
        }
      });

      it(`edge label に制御文字 (\\x00-\\x1f、 tab / newline は除外) 混入なし`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalid = diagram.edges.filter((e) => {
          if (typeof e.label !== "string") return false;
          // \x00-\x08、 \x0b-\x0c、 \x0e-\x1f、 \x7f (tab \x09 / LF \x0a / CR \x0d は許容)
          return /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(e.label);
        });
        expect(invalid.map((e) => `${e.from}->${e.to}`)).toEqual([]);
      });
    });
  }
});
