/**
 * sample compile output types 網羅 (iter68、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter68。
 * 全 12 sample の compile 出力の型網羅 verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter68: 全 12 sample × compile 出力 型網羅", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`diagram top-level が object`, () => {
        const d = textDslToDiagram(sample.code);
        expect(typeof d).toBe("object");
        expect(d).not.toBeNull();
      });

      it(`nodes.length + edges.length + states.length + phases.length が number`, () => {
        const d = textDslToDiagram(sample.code);
        expect(typeof d.nodes.length).toBe("number");
        expect(typeof d.edges.length).toBe("number");
        expect(typeof d.states.length).toBe("number");
        expect(typeof d.phases.length).toBe("number");
      });

      it(`全 array field が Array.isArray true`, () => {
        const d = textDslToDiagram(sample.code);
        expect(Array.isArray(d.nodes)).toBe(true);
        expect(Array.isArray(d.edges)).toBe(true);
        expect(Array.isArray(d.states)).toBe(true);
        expect(Array.isArray(d.phases)).toBe(true);
      });

      it(`各 node は object`, () => {
        const d = textDslToDiagram(sample.code);
        for (const n of d.nodes) {
          expect(typeof n).toBe("object");
        }
      });

      it(`各 edge は object`, () => {
        const d = textDslToDiagram(sample.code);
        for (const e of d.edges) {
          expect(typeof e).toBe("object");
        }
      });

      it(`各 state は object`, () => {
        const d = textDslToDiagram(sample.code);
        for (const s of d.states) {
          expect(typeof s).toBe("object");
        }
      });

      it(`各 phase は object`, () => {
        const d = textDslToDiagram(sample.code);
        for (const p of d.phases) {
          expect(typeof p).toBe("object");
        }
      });
    });
  }
});
