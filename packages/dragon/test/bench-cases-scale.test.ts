import { describe, it, expect } from "vitest";
import { parseTextDslV05, compileToCdl } from "@cardenelabs/dragon";
import { CASES, 最小と最大, 記法を作る, type 図の種類, type BenchCase } from "./bench-cases";

/**
 * 速さを測る入力が、段ごとに大きさへ反応することの検証 (#2250)。
 *
 * ## 同じ値が 5 行並ぶ計測は、測れていない
 *
 * 3 段とも `sequence` で測っていた間、配置の 5 行が全て同じ桁で、しかも
 * **1000 箱のほうが 10 箱より速かった** (373,359 回/秒 に対し 405,231 回/秒)。
 * 読み取りは 115 倍、組み立ては 2698 倍の差が出ていたので、配置だけが反応していない。
 *
 * 原因は測り方ではなく入力にあった。 `sequence` は箱が何個あっても 1 枚の板に組み上がり、
 * 箱と矢印は板の中の値になる。 配置が並べるのは板 1 枚なので仕事が増えない。
 *
 * ## 前提そのものを確かめる
 *
 * 計測の側は「`sequence` は 1 枚 / `flow` は箱の数だけ」 を前提に段ごとの種類を分けている。
 * **前提を注記に書くだけにしない** = 組み上げ方が変われば分け方の理由が消えるが、
 * 計測は値を出し続けるので気付けない。 ここで実際に組み上げて数える。
 *
 * ## 時間は測らない
 *
 * 速さは機械の混み具合で変わるため、検査の判定材料にしない
 * (`vitest.config.ts` が待ち時間を伸ばした時と同じ理由)。
 * 見るのは **組み上がった箱の数** で、これは機械が混んでも変わらない。
 */

function 組み上げた箱の数(種類: 図の種類, c: BenchCase): number {
  const r = parseTextDslV05(記法を作る(種類, c));
  if (!r.ok) {
    throw new Error(
      `${種類} / ${c.label} を読み取れない: ${r.errors.map((e) => `L${e.line} ${e.message}`).join(", ")}`,
    );
  }
  return compileToCdl(r.doc).nodes.length;
}

const { 最小, 最大 } = 最小と最大();

describe("速さを測る入力が大きさに反応する (#2250)", () => {
  it("入力の組を取れている", () => {
    // 取れていなければ、以下の検査は回るものが無いまま通る
    expect(CASES.length, "測る入力が 1 つも無い").toBeGreaterThan(1);
    expect(最大.nodes / 最小.nodes, "最小と最大の差が小さすぎて反応を見られない").toBeGreaterThan(10);
  });

  it("配置が測る種類は、箱の数が入力の数だけ出る", () => {
    // ここが崩れると、配置の 5 行がまた同じ値になる
    for (const c of CASES) {
      expect(組み上げた箱の数("flow", c), `${c.label} の箱の数が入力と合わない`).toBe(c.nodes);
    }
  });

  it("読み取りと組み立てが測る種類は、箱の数が大きさによらず 1 枚のまま", () => {
    // 分け方の理由そのもの。 ここが変われば 3 段とも同じ種類で測れるようになる
    const 数 = CASES.map((c) => 組み上げた箱の数("sequence", c));
    expect(new Set(数), "板の枚数が入力の大きさで変わっている (分ける理由が消えた)").toEqual(
      new Set([1]),
    );
  });

  it("2 つの種類で箱の数が実際に違う (植え込み対照)", () => {
    // 同じ数を返す実装だと、上の 2 本はどちらも通ってしまう
    expect(組み上げた箱の数("flow", 最大)).toBeGreaterThan(組み上げた箱の数("sequence", 最大) * 10);
  });
});
