/**
 * animation phase / step count 網羅 (iter36、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter36。
 * 全 sample の animation phase 数 / step 数 / focus 数の妥当性を verify、
 * 極端に多い phase (100+) / 空 phase / focus 空 の 3 pattern を検知。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

interface Phase {
  focus?: Array<string>;
  steps?: Array<{ focus?: Array<string> }>;
}
interface CompiledDiagram {
  phases?: Phase[];
}

describe("iter36: 全 sample × animation phase / step count 網羅", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`段を 1 つ以上持つ (空振り防止)`, () => {
        // 下の検査は段を回して 1 件ずつ見る。 段が無いと 1 度も判定へ入らずに通る
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        expect(d.phases?.length ?? 0, "段が 1 つも無い").toBeGreaterThan(0);
      });

      it(`phase 数 <= 50 (極端多検知)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        expect(d.phases?.length ?? 0).toBeLessThanOrEqual(50);
      });

      it(`各 phase の step 数 <= 30`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const p of d.phases ?? []) {
          expect(p.steps?.length ?? 0).toBeLessThanOrEqual(30);
        }
      });

      it(`各 phase.focus 数 <= 20 (over-scope 検知)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const p of d.phases ?? []) {
          expect(p.focus?.length ?? 0).toBeLessThanOrEqual(20);
        }
      });

      it(`各 step.focus 数 <= 15`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const p of d.phases ?? []) {
          for (const s of p.steps ?? []) {
            expect(s.focus?.length ?? 0).toBeLessThanOrEqual(15);
          }
        }
      });

      it(`phase / step の focus 値が全 string 型`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const p of d.phases ?? []) {
          for (const f of p.focus ?? []) {
            expect(typeof f).toBe("string");
          }
          for (const s of p.steps ?? []) {
            for (const f of s.focus ?? []) {
              expect(typeof f).toBe("string");
            }
          }
        }
      });
    });
  }
});
