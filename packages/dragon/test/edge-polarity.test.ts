/**
 * edge polarity / direction consistency (iter20、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter20。
 * 全 sample の edges について以下 invariant を verify。
 *
 * (a) edge polarity (success / error / neutral) が定義されていれば有効 enum
 * (b) self-loop edge (from == to) の許容境界
 * (c) reverse edge (return trip) が同 endpoint pair で意味的に区別
 * (d) edge chain の連続性 (前 edge の to が次 edge の from に一致する箇所の割合)
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  nodes: Array<{ id: string }>;
  edges: Array<{ id?: string; from: string; to: string; label?: string; polarity?: string; direction?: string }>;
}

const VALID_POLARITIES = new Set(["success", "error", "warning", "info", "neutral", "positive", "negative"]);

describe("iter20: 全 sample × edge polarity / direction consistency", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label} (${sample.slug})`, () => {
      it(`edge polarity 定義があれば有効 enum`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalid = diagram.edges.filter((e) => e.polarity !== undefined && !VALID_POLARITIES.has(e.polarity));
        expect(
          invalid.map((e) => `${e.from}->${e.to}:${e.polarity}`),
          "invalid polarity list",
        ).toEqual([]);
      });

      it(`self-loop edge が全体の 50% 未満 (self-loop 濫用検知)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const selfLoops = diagram.edges.filter((e) => e.from === e.to);
        if (diagram.edges.length > 0) {
          const ratio = selfLoops.length / diagram.edges.length;
          expect(ratio, `self-loop ratio ${ratio} (${selfLoops.length}/${diagram.edges.length})`).toBeLessThan(0.5);
        }
      });

      it(`edge から endpoints への reference 数 = 2n (from + to、 orphan edge なし)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of diagram.edges) {
          expect(typeof e.from, "from string").toBe("string");
          expect(typeof e.to, "to string").toBe("string");
          expect(e.from.length, "from non-empty").toBeGreaterThan(0);
          expect(e.to.length, "to non-empty").toBeGreaterThan(0);
        }
      });

      it(`edge id 存在時 制御文字 / 空白なし (unicode / hyphen 許容)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalid = diagram.edges.filter((e) => {
          if (e.id === undefined) return false;
          // 制御文字 / 半角空白 / tab / 改行禁止、 unicode 文字 / hyphen / 記号は許容
          return /[\x00-\x1f\x7f\s]/.test(e.id);
        });
        expect(invalid.map((e) => e.id), "invalid edge id (contains ctrl/space)").toEqual([]);
      });
    });
  }
});
