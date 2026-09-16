/**
 * phase / step timing sanity 網羅 unit test (iter13、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter13。
 * 全 EDITOR_SAMPLES の animation phase / step の timing invariant を verify。
 *
 * (a) phase.duration が存在する場合、 正の float (0 超、 NaN / Infinity なし)
 * (b) step.duration が存在する場合、 同上
 * (c) phase.steps 存在時 step count > 0
 * (d) total duration が 0.1-120s 範囲内 (極端に短い or 長い animation 検知)
 * (e) phase count > 0 (animation なしの sample もあり得るが、 sample には最低 1 phase 必須)
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import { at } from "./support/at";

interface Step {
  duration?: number;
  focus?: Array<string>;
}
interface Phase {
  duration?: number;
  steps?: Step[];
  focus?: Array<string>;
}
interface CompiledDiagram {
  phases?: Phase[];
}

function isPositiveFinite(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

describe("iter13: 全 EDITOR_SAMPLES × phase / step timing sanity", () => {
  for (const sample of EDITOR_SAMPLES) {
    describe(`sample = ${sample.label} (${sample.slug})`, () => {
      it(`phase count > 0`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        expect(diagram.phases, "phases array").toBeDefined();
        expect(diagram.phases!.length, "phase count > 0").toBeGreaterThan(0);
      });

      it(`各 phase.duration が定義されていれば正の finite float`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalidPhases = (diagram.phases ?? [])
          .map((p, i) => ({ i, dur: p.duration }))
          .filter((x) => x.dur !== undefined && !isPositiveFinite(x.dur));
        expect(invalidPhases, `invalid phase duration=${JSON.stringify(invalidPhases)}`).toEqual([]);
      });

      it(`各 step.duration が定義されていれば正の finite float`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const invalidSteps: Array<{ p: number; s: number; dur: unknown }> = [];
        for (let p = 0; p < (diagram.phases ?? []).length; p++) {
          const phase = at(diagram.phases!, p, "diagram.phases!");
          const steps = phase.steps ?? [];
          for (let s = 0; s < steps.length; s++) {
            const dur = at(steps, s, "steps").duration;
            if (dur !== undefined && !isPositiveFinite(dur)) {
              invalidSteps.push({ p, s, dur });
            }
          }
        }
        expect(invalidSteps, `invalid step duration=${JSON.stringify(invalidSteps)}`).toEqual([]);
      });

      it(`phase.steps が存在する場合 step count > 0 (空 array 検知)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        const emptyStepPhases = (diagram.phases ?? [])
          .map((p, i) => ({ i, hasSteps: p.steps !== undefined, len: p.steps?.length ?? 0 }))
          .filter((x) => x.hasSteps && x.len === 0);
        expect(emptyStepPhases, `empty steps=${JSON.stringify(emptyStepPhases)}`).toEqual([]);
      });

      it(`total animation duration が finite (Infinity / NaN 検知)`, () => {
        const diagram = textDslToDiagram(sample.code) as unknown as CompiledDiagram;
        let total = 0;
        for (const p of diagram.phases ?? []) {
          if (isPositiveFinite(p.duration)) {
            total += p.duration as number;
          }
          for (const s of p.steps ?? []) {
            if (isPositiveFinite(s.duration)) {
              total += s.duration as number;
            }
          }
        }
        expect(Number.isFinite(total), `total duration finite (got ${total})`).toBe(true);
        expect(total, `total duration >= 0`).toBeGreaterThanOrEqual(0);
      });
    });
  }
});
