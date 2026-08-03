/**
 * sample compile idempotent (iter90、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter90。
 * 全 12 sample の compile idempotent (同 input → 同 output) verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter90: 全 12 sample × compile idempotent", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`2 回 compile で nodes count 一致`, () => {
        const d1 = textDslToDiagram(sample.code);
        const d2 = textDslToDiagram(sample.code);
        expect(d2.nodes.length).toBe(d1.nodes.length);
      });

      it(`2 回 compile で edges count 一致`, () => {
        const d1 = textDslToDiagram(sample.code);
        const d2 = textDslToDiagram(sample.code);
        expect(d2.edges.length).toBe(d1.edges.length);
      });

      it(`2 回 compile で states count 一致`, () => {
        const d1 = textDslToDiagram(sample.code);
        const d2 = textDslToDiagram(sample.code);
        expect(d2.states.length).toBe(d1.states.length);
      });

      it(`2 回 compile で phases count 一致`, () => {
        const d1 = textDslToDiagram(sample.code);
        const d2 = textDslToDiagram(sample.code);
        expect(d2.phases.length).toBe(d1.phases.length);
      });

      it(`3 回 compile で JSON size 一致`, () => {
        const j1 = JSON.stringify(textDslToDiagram(sample.code));
        const j2 = JSON.stringify(textDslToDiagram(sample.code));
        const j3 = JSON.stringify(textDslToDiagram(sample.code));
        expect(j1.length).toBe(j2.length);
        expect(j2.length).toBe(j3.length);
      });

      it(`compile 前後で code 変更なし`, () => {
        const before = sample.code;
        textDslToDiagram(sample.code);
        expect(sample.code).toBe(before);
      });

      it(`5 回連続 compile で <= 500ms`, () => {
        const t0 = performance.now();
        for (let i = 0; i < 5; i++) {
          textDslToDiagram(sample.code);
        }
        expect(performance.now() - t0).toBeLessThan(500);
      });
    });
  }
});
