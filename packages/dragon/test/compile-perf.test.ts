/**
 * compile 時間上限 verify (iter22、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter22。
 * 全 sample の textDslToDiagram 呼出が個別 100ms、 集約 500ms 以内で完了することを verify。
 * regression 検知 gate (compile ロジックに N² が混入して sample DSL で 秒級 slow-down する事故を捕捉)。
 *
 * ## 見本ごとの検査は 5 回呼んで最も速い回を比べる (#2064)
 *
 * 1 回だけ測ると、全件の検査を並べて回した負荷で 1 回の計測が伸びて落ちる (#2062 の全件検査で
 * 124ms を実測、 他の見本は 0-14ms)。 新しい process で見本ごとに測り直すと、 全件検査と並べた
 * 2,875 組のうち最初の 1 回は 9 組が 100ms を越え (最大 292.4ms)、 5 回の最速は 1 組も越えなかった
 * (最大 5.3ms)。
 *
 * 変換そのものが遅くなれば 5 回とも遅くなるので、 狙っている事故は引き続き捕まえる。 **初回だけ
 * 重い変化 (最初の呼出しだけで行う準備) は対象にしない**。 最速を採ると、 その 1 回は捨てられる。
 *
 * 合計を比べる 2 件 (通算 / 10 回) は変えない。 1 回の伸び (最大 292.4ms) では上限 500ms に届かない。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import { at } from "./support/at";

/** 見本ごとの上限 (ms) */
const 上限ms = 100;

/** 見本ごとに変換を呼ぶ回数。 対照も同じ値を使う */
const 測る回数 = 5;

/**
 * `実行` を `回数` だけ呼び、 最も速かった回の所要 (ms) を返す。
 *
 * 時刻を読む関数は差し替えられる。 対照を実時間で待たずに組むため。
 */
function 最も速い回(実行: () => void, 回数: number, 今: () => number = () => performance.now()): number {
  let 最速 = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 回数; i++) {
    const 始 = 今();
    実行();
    最速 = Math.min(最速, 今() - 始);
  }
  return 最速;
}

/**
 * 呼ぶたびに `かかる時間` の値だけ時刻が進む、 作り物の変換と時計。
 * 回数より値が少なければ、 足りない回は時間がかからない。
 */
function 作り物の変換(かかる時間: readonly number[]): { 実行: () => void; 今: () => number } {
  let 時刻 = 0;
  let 呼んだ回 = 0;
  return {
    実行: () => {
      時刻 += かかる時間[呼んだ回] ?? 0;
      呼んだ回++;
    },
    今: () => 時刻,
  };
}

describe("iter22: compile 時間上限 verify", () => {
  for (const sample of EDITOR_SAMPLES) {
    it(`${sample.label}: textDslToDiagram <= 100ms`, () => {
      const dt = 最も速い回(() => textDslToDiagram(sample.code), 測る回数);
      expect(dt, `${sample.label} compile ${dt}ms (${測る回数} 回の最速)`).toBeLessThan(上限ms);
    });
  }

  it(`全 sample 通算 compile <= 500ms`, () => {
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

describe("見本ごとの変換時間の測り方 (#2064)", () => {
  it("毎回遅い変換は、 何回測っても上限を越える", () => {
    // 植え込み対照。 測り方が値を捨てる形に壊れると、 本番の検査は変換が遅くなっても通る
    const { 実行, 今 } = 作り物の変換(Array.from({ length: 測る回数 }, () => 150));
    expect(最も速い回(実行, 測る回数, 今)).toBeGreaterThanOrEqual(上限ms);
  });

  it("1 回だけ伸びた変換は、 上限を越えない", () => {
    // 陰性対照。 全件の検査を並べて回すと、 1 回の計測だけが伸びる (#2062 で 124ms)
    const { 実行, 今 } = 作り物の変換([150, ...Array.from({ length: 測る回数 - 1 }, () => 1)]);
    expect(最も速い回(実行, 測る回数, 今)).toBeLessThan(上限ms);
  });
});
