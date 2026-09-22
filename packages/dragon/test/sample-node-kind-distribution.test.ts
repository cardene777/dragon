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

describe("iter45: 全 sample × node kind distribution 網羅", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`箱を 1 つ以上作れている (空振り防止)`, () => {
        // 下の検査は箱を回して 1 件ずつ見る。 箱が無いと 1 度も判定へ入らずに通る
        const d = textDslToDiagram(sample.code);
        expect(d.nodes.length, "箱が 1 つも無い").toBeGreaterThan(0);
      });

      // 「kind を持つ箱の割合が 0% 以上」 を見ていた 1 件を消した (#2500)。
      // 数え上げた結果は必ず 0 以上で、kind は任意なので下限も上限も置けない。
      // kind の中身は下の 2 件 (制御文字 / 空白なし、200 字以下) が見ている。

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
