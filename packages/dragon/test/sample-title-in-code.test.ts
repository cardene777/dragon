/**
 * sample title in code 網羅 (iter76、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter76。
 * 各 sample DSL 内の title フィールドを regex 抽出、 spec 妥当性 verify。
 */
import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

describe("iter76: 全 12 sample × title in code 網羅", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`code に title フィールド存在`, () => {
        const m = sample.code.match(/^title:\s*"[^"]+"/m);
        expect(m).not.toBeNull();
      });

      it(`title フィールド value が 100 char 以下`, () => {
        const m = sample.code.match(/^title:\s*"([^"]+)"/m);
        if (m) {
          expect(m[1].length).toBeLessThanOrEqual(100);
        }
      });

      it(`title に制御文字なし`, () => {
        const m = sample.code.match(/^title:\s*"([^"]+)"/m);
        if (m) {
          expect(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(m[1])).toBe(false);
        }
      });

      it(`type field が単一 word or slug`, () => {
        const m = sample.code.match(/^type:\s*([^\s]+)/m);
        if (m) {
          expect(/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(m[1])).toBe(true);
        }
      });

      it(`code に flow or actors section いずれか存在`, () => {
        const hasFlow = sample.code.includes("flow:");
        const hasActors = sample.code.includes("actors:");
        expect(hasFlow || hasActors).toBe(true);
      });
    });
  }
});
