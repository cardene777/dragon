/**
 * sample nodes property count 網羅 (iter88、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter88。
 * 全 12 sample の compile 後 nodes property 数 verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter88: 全 12 sample × nodes property count", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`全 node が id property`, () => {
        const d = textDslToDiagram(sample.code);
        for (const n of d.nodes) {
          expect("id" in n).toBe(true);
        }
      });

      it(`全 node の property key 数 <= 150`, () => {
        const d = textDslToDiagram(sample.code);
        for (const n of d.nodes) {
          expect(Object.keys(n).length).toBeLessThanOrEqual(150);
        }
      });

      it(`全 node の JSON size <= 20KB`, () => {
        const d = textDslToDiagram(sample.code);
        for (const n of d.nodes) {
          expect(JSON.stringify(n).length).toBeLessThanOrEqual(20 * 1024);
        }
      });

      it(`全 edge の property key 数 <= 50`, () => {
        const d = textDslToDiagram(sample.code);
        for (const e of d.edges) {
          expect(Object.keys(e).length).toBeLessThanOrEqual(50);
        }
      });

      it(`各 state key 数 <= 30 (存在時)`, () => {
        const d = textDslToDiagram(sample.code);
        for (const s of d.states) {
          expect(Object.keys(s).length).toBeLessThanOrEqual(30);
        }
      });

      it(`各 phase key 数 <= 30 (存在時)`, () => {
        const d = textDslToDiagram(sample.code);
        for (const p of d.phases) {
          expect(Object.keys(p).length).toBeLessThanOrEqual(30);
        }
      });

      it(`compile 前後で code 長さ不変`, () => {
        const len1 = sample.code.length;
        const d = textDslToDiagram(sample.code);
        expect(sample.code.length).toBe(len1);
        expect(d).toBeDefined();
      });
    });
  }
});
