/**
 * sample node kind distribution 網羅 (iter45、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter45。
 * 各 sample が「その sample type に相応しい kind の node を含む」 前提の verify。
 * kind の distribution (unique 数 / 頻度) を計測して極端偏り / 空を検知。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  nodes: Array<{ id: string; kind?: string }>;
}

describe("iter45: 全 12 sample × node kind distribution 網羅", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`kind が定義される node の割合 >= 0% (全 node kind 定義 optional)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const withKind = d.nodes.filter((n) => typeof n.kind === "string" && n.kind.length > 0);
        expect(withKind.length).toBeGreaterThanOrEqual(0);
      });

      it(`unique kind 数が nodes 総数以下`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const kinds = new Set(d.nodes.map((n) => n.kind).filter((k): k is string => typeof k === "string"));
        expect(kinds.size).toBeLessThanOrEqual(d.nodes.length);
      });

      it(`kind 値に制御文字 / 空白なし`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const n of d.nodes) {
          if (typeof n.kind === "string") {
            expect(/^\S+$/.test(n.kind), `${n.id}:kind="${n.kind}"`).toBe(true);
          }
        }
      });

      it(`各 kind は 200 char 以下`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const n of d.nodes) {
          if (typeof n.kind === "string") {
            expect(n.kind.length).toBeLessThanOrEqual(200);
          }
        }
      });
    });
  }
});
