/**
 * animation focus dedup 網羅 (iter46、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter46。
 * 各 phase / step の focus[] 内で同一 ref が重複していないか verify (typo dup 検知)。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import { at } from "./support/at";

interface CompiledDiagram {
  phases?: Array<{
    focus?: Array<string>;
    steps?: Array<{ focus?: Array<string> }>;
  }>;
}

describe("iter46: 全 sample × animation focus dedup", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`phase.focus 内 dedup`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (let p = 0; p < (d.phases ?? []).length; p++) {
          const focus = at(d.phases!, p, "d.phases!").focus ?? [];
          const dups = focus.length - new Set(focus).size;
          expect(dups, `phase[${p}] focus dup ${focus.join(",")}`).toBe(0);
        }
      });

      it(`step.focus 内 dedup`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (let p = 0; p < (d.phases ?? []).length; p++) {
          const steps = at(d.phases!, p, "d.phases!").steps ?? [];
          for (let s = 0; s < steps.length; s++) {
            const focus = at(steps, s, "steps").focus ?? [];
            const dups = focus.length - new Set(focus).size;
            expect(dups, `phase[${p}].step[${s}] focus dup ${focus.join(",")}`).toBe(0);
          }
        }
      });

      it(`phase 全体で focus ref 総数 <= 200`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        let total = 0;
        for (const p of d.phases ?? []) {
          total += p.focus?.length ?? 0;
          for (const s of p.steps ?? []) {
            total += s.focus?.length ?? 0;
          }
        }
        expect(total).toBeLessThanOrEqual(200);
      });
    });
  }
});
