/**
 * sample diagram property details (iter93、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter93。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter93: 全 12 sample × diagram property details", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`diagram top-level property 数 >= 1`, () => {
        const d = textDslToDiagram(sample.code);
        expect(Object.keys(d).length).toBeGreaterThanOrEqual(1);
      });

      it(`diagram top-level property 数 <= 30`, () => {
        const d = textDslToDiagram(sample.code);
        expect(Object.keys(d).length).toBeLessThanOrEqual(30);
      });

      it(`nodes property 存在`, () => {
        const d = textDslToDiagram(sample.code);
        expect("nodes" in d).toBe(true);
      });

      it(`edges property 存在`, () => {
        const d = textDslToDiagram(sample.code);
        expect("edges" in d).toBe(true);
      });

      it(`states property 存在`, () => {
        const d = textDslToDiagram(sample.code);
        expect("states" in d).toBe(true);
      });

      it(`phases property 存在`, () => {
        const d = textDslToDiagram(sample.code);
        expect("phases" in d).toBe(true);
      });

      it(`JSON size < 1MB`, () => {
        const d = textDslToDiagram(sample.code);
        expect(JSON.stringify(d).length).toBeLessThan(1024 * 1024);
      });
    });
  }
});
