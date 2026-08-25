/**
 * phase / step focus 非空検証 (iter48、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter48。
 * animation で step.focus が空 array で定義されると animation 効果なし、
 * 明示的に検知 gate。
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

describe("iter48: 全 12 sample × phase / step focus 非空", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label}`, () => {
      it(`phase.focus 存在時は非空 array (空 [] は typo signal)`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (let p = 0; p < (d.phases ?? []).length; p++) {
          const focus = at(d.phases!, p, "d.phases!").focus;
          if (focus !== undefined) {
            expect(focus.length, `phase[${p}] focus 空`).toBeGreaterThan(0);
          }
        }
      });

      it(`step.focus 存在時は非空 array`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (let p = 0; p < (d.phases ?? []).length; p++) {
          const steps = at(d.phases!, p, "d.phases!").steps ?? [];
          for (let s = 0; s < steps.length; s++) {
            const focus = at(steps, s, "steps").focus;
            if (focus !== undefined) {
              expect(focus.length, `phase[${p}].step[${s}] focus 空`).toBeGreaterThan(0);
            }
          }
        }
      });

      it(`各 focus ref が非空 string`, () => {
        const d = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        for (const p of d.phases ?? []) {
          for (const f of p.focus ?? []) {
            expect(typeof f, `phase focus type`).toBe("string");
            expect(f.length, `phase focus empty`).toBeGreaterThan(0);
          }
          for (const s of p.steps ?? []) {
            for (const f of s.focus ?? []) {
              expect(typeof f).toBe("string");
              expect(f.length).toBeGreaterThan(0);
            }
          }
        }
      });
    });
  }
});
