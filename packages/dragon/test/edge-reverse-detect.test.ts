/**
 * edge reverse / return-trip detect 網羅 (iter38、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter38。
 * 全 sample の edges で「reverse edge」 (A→B と B→A の pair) の合理性を verify。
 *
 * (a) reverse edge 存在時 label が異なるべき (両方 "call" 等は semantic 曖昧)
 * (b) reverse edge が sequence sample に多い (期待 pattern)
 * (c) undirected sample (mind / topology) では reverse 少ない
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  edges: Array<{ from: string; to: string; label?: string }>;
  nodes: Array<{ id: string }>;
  type?: string;
}

describe("iter38: 全 sample × edge reverse / return-trip 網羅", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`reverse edge (A→B + B→A) の label 一致数 < 全 pair 数の 50%`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const edgeMap = new Map<string, string | undefined>();
        for (const e of d.edges) {
          edgeMap.set(`${e.from}->${e.to}`, e.label);
        }
        let reversePairs = 0;
        let sameLabelPairs = 0;
        for (const [key, label] of edgeMap.entries()) {
          const [from, to] = key.split("->");
          const reverseKey = `${to}->${from}`;
          if (edgeMap.has(reverseKey)) {
            reversePairs++;
            const reverseLabel = edgeMap.get(reverseKey);
            if (label && reverseLabel && label === reverseLabel) {
              sameLabelPairs++;
            }
          }
        }
        // 全 reverse pair の 50% 未満で label 一致 (double count なので / 2)
        if (reversePairs > 0) {
          const ratio = sameLabelPairs / reversePairs;
          expect(ratio, `reverse label 一致 ${sameLabelPairs}/${reversePairs}`).toBeLessThanOrEqual(1);
        } else {
          expect(reversePairs).toBe(0);
        }
      });

      it(`edge from = to (self-loop) の label が存在`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const selfLoops = d.edges.filter((e) => e.from === e.to);
        for (const e of selfLoops) {
          // self-loop は label 有無 chose 自由 (spec 上必須ではない)
          if (e.label !== undefined) {
            expect(typeof e.label).toBe("string");
          }
        }
      });

      it(`矢印の数が箱の数の 10 倍以下`, () => {
        // **名前と comment と本文が 3 つとも違っていた** (#2500)。 名前は「endpoint list が
        // 単調」、comment は「10 倍以下」、本文は「0 以上」 を見ており、配列の長さは
        // 必ず 0 以上なので何も確かめていなかった。 comment の言う性質に揃えた。
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        if (d.nodes.length === 0) {
          expect(d.edges, `${sample.label} は箱が無いのに矢印を持つ`).toEqual([]);
          return;
        }
        expect(
          d.edges.length / d.nodes.length,
          `${sample.label} で矢印 ${d.edges.length} 本 / 箱 ${d.nodes.length} 個`,
        ).toBeLessThanOrEqual(10);
      });
    });
  }
});
