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
 *
 * ## 測り方を壁時計から CPU 時間へ移した (#2526)
 *
 * 合計へ移しても **測る道具は壁時計のまま** だった。 壁時計は待たされた分も足すので、
 * 一式を回すと同じ入力でも値が動く。 図 599 枚を 3 周する形を 10 回 (単独 5 回 / 一式 5 回)
 * 測った実測。
 *
 * | 測り方 | 全 30 周の幅 |
 * |---|---|
 * | 壁時計 | 296..1990ms (6.72 倍) |
 * | CPU 時間 | 329.7..861.7ms (2.61 倍) |
 *
 * 境に対する割合は書かない。 境は描く側が決める数なので、写すと描く側が変えた時に この表だけが
 * 黙って間違いになる。 § 測った最悪値が今の境のどこに居るか が入口から読んだ境で割って出す。
 *
 * `0.81.0` で engine が CPU 時間で測るようになった (`cardene777/cdl#897`)。
 * 待っている間は増えないため、一式を回した時の幅が 2.90 倍から 1.87 倍に縮む。
 *
 * **採らなかった案と理由**。 起票時は 3 案あった。
 *
 * | 案 | なぜ採らなかったか |
 * |---|---|
 * | この検査を一式から外す | 一式を回しても速さを見なくなる。 見落としを見落としに変えるだけ |
 * | 判定を件数へ変える | 速さそのものを見なくなる。 遅くなった時に気付けない |
 * | 境を上げる | 何 ms なら正しいかの根拠が無く、落ちるたびに上げる経路に入る |
 *
 * どの案も値がぶれる理由 (壁時計) に触れない。 道具を替えれば 3 案とも要らなくなる。
 *
 * ## 測り方そのものを押さえる
 *
 * CPU 時間が読めない環境では engine が壁時計に落ちる。 落ちたことは超過の文面にしか出ない
 * ので、超過していない周では分からない。 § CPU 時間で測れている で返り値を直接見る。
 */
import { readFileSync } from "node:fs";

import { describe, it, expect } from "vitest";
import { visualValidateAll, PERF_BUDGET_TOTAL_MS } from "@cardenelabs/cdl";

import { 全図, カタログの群の名 } from "./support/responsive-accepted";
import { 実在する群 } from "./support/catalog-groups";

/** 3 周を 1 度だけ回して使い回す (444 枚 × 3 周を検査ごとに繰り返さない)。 */
const 周: ReadonlyArray<{ 件数: number; 文面: string[]; 軸がある: boolean; 測り方: string }> = [
  0, 1, 2,
].map(() => {
  const res = visualValidateAll(全図);
  const v = res.metaViolations.filter((x) => x.axis === "validate-performance-budget");
  return {
    件数: v.length,
    文面: v.map((x) => x.detail),
    軸がある: "validate-performance-budget" in res.totalCounts,
    測り方: res.perfClock,
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

  it("CPU 時間で測れている (#2526)", () => {
    /*
     * 壁時計に落ちたことは超過の文面にしか出ないので、超過していない周では分からない。
     * 返り値を直接見て、意図した道具で測れていることを 3 周とも押さえる。
     */
    for (const [i, r] of 周.entries()) {
      expect(r.測り方, `${i + 1} 周目が CPU 時間で測れていない`).toBe("cpu");
    }
  });

  it("境を写していない (#2577)", () => {
    /*
     * 境は描く側 (`@cardenelabs/cdl`) が持つ数で、こちらが決めた数ではない。 この file に
     * 書き写すと、描く側が境を変えた時に説明文だけが黙って間違いになる (機械が読む箇所は
     * 無いので検査は落ちない = 落ちないことが問題)。 自分の中身を読んで literal を数える。
     */
    const 本文 = readFileSync(new URL(import.meta.url), "utf8");
    const 境の桁 = String(PERF_BUDGET_TOTAL_MS);
    const 写した行 = 本文
      .split("\n")
      .map((l, i) => [i + 1, l] as const)
      .filter(([, l]) => l.includes(境の桁) && !l.includes("PERF_BUDGET_TOTAL_MS"));
    expect(写した行.map(([i, l]) => `${i}: ${l.trim()}`), "境を literal で書いている").toEqual([]);
  });

  it("入口から境が届いている (#2577)", () => {
    /*
     * 版を上げても入口から出ていなければ `undefined` が来る。 上の検査は `String(undefined)`
     * を探して 0 件になり通ってしまうので、届いていること自体を別に押さえる。
     */
    expect(typeof PERF_BUDGET_TOTAL_MS, "境が数で届いていない").toBe("number");
    expect(PERF_BUDGET_TOTAL_MS).toBeGreaterThan(0);
  });

  it("測った最悪値が今の境のどこに居るか (#2577)", () => {
    /*
     * 上の表の実測のうち最も重かった 1 件。 ms は測った事実なので残し、境に対する割合は
     * 入口から読んだ境で割って出す。 判定はせず、失敗の文面に出すための行として置く
     * (何 % なら正しいかの根拠が無いため、新しい境を足さない)。
     */
    const 測った最悪 = 861.7;
    const 割合 = (測った最悪 / PERF_BUDGET_TOTAL_MS) * 100;
    expect(
      割合 < 100,
      `測った最悪 ${測った最悪}ms は今の境 ${PERF_BUDGET_TOTAL_MS}ms の ${割合.toFixed(1)}%`,
    ).toBe(true);
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
