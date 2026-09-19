/**
 * 速さの判定が、同じ入力なら周ごとに変わらないことを見る (#1736)。
 *
 * 描画エンジンの軸 `validate-performance-budget` は、`0.41.0` まで **1 枚ごとの壁時計**
 * を境と比べていた。 壁時計は図の性質ではなく機械の都合で動く。 カタログ 444 枚を同じ
 * process で 3 周した実測。
 *
 * | 図 | 1 周目 | 2 周目 | 3 周目 |
 * |---|---|---|---|
 * | `interactive-social-share-buttons` | 53ms | 0ms | 1ms |
 * | `interactive-traffic-sankey` | 50ms | 159ms | 115ms |
 *
 * 1 つ目は最初の 1 回だけ掛かる下準備、 2 つ目は機械の混み具合で、 超過した枚数は
 * 3 周で 1 / 0 / 0 件と割れていた。 `0.41.1` で判定を全図の合計へ移してある
 * (cdl#776)。
 *
 * **この検査が見るのは件数の値ではなく、周ごとに同じかどうか**。 合計を見る形なら
 * 混んだ機械でも 3 周とも同じ側 (超過なら 1 / 1 / 1) に倒れる。 値を 0 に固定すると
 * 混んだ機械で落ちる検査になり、 直したい性質 (毎回変わること) を測らない。
 *
 * 軸が消えても「3 周とも同じ」 は成り立ってしまうため、
 * § 軸そのものが残っている で軸の実在を別に押さえる。
 */
import { describe, it, expect } from "vitest";
import { visualValidateAll } from "@cardenelabs/cdl";

import { 全図, カタログの群の名 } from "./support/responsive-accepted";
import { 実在する群 } from "./support/catalog-groups";

/** 3 周を 1 度だけ回して使い回す (444 枚 × 3 周を検査ごとに繰り返さない)。 */
const 周: ReadonlyArray<{ 件数: number; 文面: string[]; 軸がある: boolean }> = [0, 1, 2].map(() => {
  const res = visualValidateAll(全図);
  const v = res.metaViolations.filter((x) => x.axis === "validate-performance-budget");
  return {
    件数: v.length,
    文面: v.map((x) => x.detail),
    軸がある: "validate-performance-budget" in res.totalCounts,
  };
});

describe("速さの判定が周ごとに変わらない (#1736)", () => {
  it("カタログの図を 1 枚以上集められている (空振り防止)", () => {
    expect(
      全図.length,
      "カタログの図を 1 枚も集められていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
  });

  it("走査した群が dir の実体と 1 件も違わない (#2314)", () => {
    /*
     * 群を手で並べていた頃は `parts-in-box` と `parts-motion` が抜けており、母数が
     * 546 枚しかなかった。 走査に変えただけでは走査の書き方を間違えた時に気付けないので、
     * 別の経路 (`readdirSync`) で数えた群と名前で突き合わせる。
     */
    expect(カタログの群の名(), `dir にある群 ${実在する群().length} 件と突き合わせた`).toEqual(
      実在する群(),
    );
  });

  it("3 周とも同じ件数になる", () => {
    const 件数 = 周.map((r) => r.件数);
    const 内訳 = 周.map((r, i) => `${i + 1} 周目 ${r.件数} 件 ${r.文面.join(" / ") || "(なし)"}`);
    expect(
      new Set(件数).size,
      `全 ${全図.length} 枚を 3 周した件数が揃わない: ${内訳.join(" | ")}`,
    ).toBe(1);
  });

  it("軸そのものが残っている", () => {
    /*
     * 軸を消しても「3 周とも同じ」 は 0 / 0 / 0 で成り立つ。
     * 軸が engine の一覧に残っていることを別に押さえて、 消して通る形を塞ぐ。
     */
    for (const [i, r] of 周.entries()) {
      expect(r.軸がある, `${i + 1} 周目の一覧に validate-performance-budget が無い`).toBe(true);
    }

    /*
     * 植え込み対照。 存在しない名前でも `true` を返すなら、 上の判定は軸の実在を見ていない。
     */
    const 偽の軸 = "validate-performance-budget-does-not-exist";
    expect(
      偽の軸 in visualValidateAll(全図).totalCounts,
      "存在しない軸の名前でも一覧にあると答えている (判定が軸の実在を見ていない)",
    ).toBe(false);
  });
});
