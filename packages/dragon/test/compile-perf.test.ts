/**
 * compile 時間上限 verify (iter22、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter22。
 * 全 12 sample の textDslToDiagram 呼出が個別 100ms、 集約 500ms 以内で完了することを verify。
 * regression 検知 gate (compile ロジックに N² が混入して sample DSL で 秒級 slow-down する事故を捕捉)。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import { at } from "./support/at";

describe("iter22: compile 時間上限 verify", () => {
  for (const sample of EDITOR_SAMPLES) {
    it(`${sample.label}: textDslToDiagram <= 100ms`, () => {
      const t0 = performance.now();
      textDslToDiagram(sample.code);
      const dt = performance.now() - t0;
      expect(dt, `${sample.label} compile ${dt}ms`).toBeLessThan(100);
    });
  }

  it(`全 12 sample 通算 compile <= 500ms`, () => {
    const t0 = performance.now();
    for (const sample of EDITOR_SAMPLES) {
      textDslToDiagram(sample.code);
    }
    const dt = performance.now() - t0;
    expect(dt, `total ${dt}ms`).toBeLessThan(500);
  });

  it(`同 DSL を 10 回 compile <= 500ms (cache / dedup effect)`, () => {
    const dsl = at(EDITOR_SAMPLES, 0, "EDITOR_SAMPLES").code;
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) {
      textDslToDiagram(dsl);
    }
    const dt = performance.now() - t0;
    expect(dt, `10x compile ${dt}ms`).toBeLessThan(500);
  });
});
