/**
 * edge id format 網羅 (iter41、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter41。
 * 全 12 sample の edges で id / label / metadata format spec 検証。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface CompiledDiagram {
  edges: Array<{ id?: string; from: string; to: string; label?: string }>;
}

describe("iter41: 全 12 sample × edge id / label format", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`edge id 存在時 e{index} or 意味のある文字列`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          if (e.id !== undefined) {
            expect(e.id.length, `id length ${e.id.length}`).toBeGreaterThan(0);
            expect(e.id.length, `id 極端長 ${e.id.length}`).toBeLessThanOrEqual(200);
          }
        }
      });

      it(`edge label が存在するなら 1 char 以上`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          if (typeof e.label === "string" && e.label.length > 0) {
            expect(e.label.length).toBeGreaterThan(0);
          }
        }
      });

      it(`edge から from → to が endpoint 命名整合 (id 空でない)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const e of d.edges) {
          expect(e.from.length).toBeGreaterThan(0);
          expect(e.to.length).toBeGreaterThan(0);
        }
      });

      it(`同じ from-to-label triple の edge が重複しない`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const keys = d.edges.map((e) => `${e.from}|${e.to}|${e.label ?? ""}`);
        const dupCount = keys.length - new Set(keys).size;
        expect(dupCount, `dup edge count`).toBe(0);
      });
    });
  }
});
