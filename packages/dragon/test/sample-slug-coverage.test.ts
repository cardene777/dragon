/**
 * sample slug + kind + label 網羅 (iter61、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter61。
 * 全 12 sample の metadata coverage 追加軸を verify。
 */
import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter61: 全 12 sample × slug + label + code coverage", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`label が非空 + 100 char 以下`, () => {
        expect(sample.label.length).toBeGreaterThan(0);
        expect(sample.label.length).toBeLessThanOrEqual(100);
      });

      it(`slug が非空 + 30 char 以下 + kebab-case`, () => {
        expect(sample.slug.length).toBeGreaterThan(0);
        expect(sample.slug.length).toBeLessThanOrEqual(30);
        expect(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(sample.slug)).toBe(true);
      });

      it(`code が YAML-like (title: / type: / actors: / flow: いずれか含む)`, () => {
        const hasField =
          sample.code.includes("title:") ||
          sample.code.includes("type:") ||
          sample.code.includes("actors:") ||
          sample.code.includes("flow:");
        expect(hasField).toBe(true);
      });

      it(`code の内部改行数 <= 300`, () => {
        expect(sample.code.split("\n").length).toBeLessThanOrEqual(300);
      });

      it(`label に控制文字なし`, () => {
        expect(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(sample.label)).toBe(false);
      });
    });
  }
});
