/**
 * 見本の矢印が、線を 1 本も描かない形になっていないかを見る (#2479)。
 *
 * ## 走査は何も言わない
 *
 * #2200 の調べで見つかった。 矢印の出る辺を書く (`side: right`) と、道筋が
 * `M 180 203` の 1 点だけになり **線が消える**。
 * そのとき `validate` も `visualValidateAll` も 0 件を返す。
 *
 * 線を引く側は `@cardenelabs/cdl` で、この repo からは直せない。
 * **気付ける経路をこちらに持つ** = 見本を 1 枚足した日に線が消えても、
 * いまは画面を開いた人が目で見るまで分からない。
 *
 * ## 道筋の字で見る
 *
 * 絵の見た目ではなく、組み立てが返す道筋 (`d`) を見る。
 * `M` は筆を運ぶだけで線を引かないので、**線を引く命令が 1 つも無い道筋** を数える。
 *
 * | 命令 | 何をするか |
 * |---|---|
 * | `M` / `m` | 筆を運ぶ (線は引かない) |
 * | `L` `H` `V` `C` `Q` `A` と小文字 | 線か曲線を引く |
 * | `Z` / `z` | 始点へ閉じる |
 *
 * `Z` は閉じる線を引くが、**単独では意味を持たない** (運んだだけの点に戻る)。
 * 数える対象は線か曲線を引く命令に限る。
 *
 * ## 空の道筋は数えない
 *
 * 道筋そのものが空の矢印は「描かない」 意図と区別が付かない。
 * ここが見るのは「描くつもりで書いたのに線が出ない」 形だけになる。
 *
 * ## 母集団は実物から導く
 *
 * 静的に読み込む見本と、その中の変種 (`patterns`)、遅れて読み込む `parts` 分類。
 * 走った矢印の本数を判定に使うので、組み立てが壊れて 0 本になった回も落ちる。
 */
import { describe, expect, it } from "vitest";
import { layout } from "@cardenelabs/cdl";
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";

/** 線か曲線を引く命令。 `M` (運ぶだけ) と `Z` (閉じるだけ) は入れない */
const 線を引く命令 = /[LlHhVvCcSsQqTtAa]/;

/** 道筋が線を 1 本も引かないか。 空の道筋は「描かない」 意図と区別が付かないので外す */
export function 線が無い道筋(d: string): boolean {
  const 字 = d.trim();
  if (字 === "") return false;
  return !線を引く命令.test(字);
}

interface 矢印 {
  出どころ: string;
  id: string;
  d: string;
}

/** 実物の見本を組み立てて、矢印の道筋を全部集める */
async function 実物の矢印(): Promise<矢印[]> {
  const 分類ごと: [string, CatalogItem[]][] = [
    ...Object.entries(CATALOG_ITEMS),
    ["parts", await loadPartsItems()],
  ];
  const out: 矢印[] = [];
  for (const [分類, items] of 分類ごと) {
    for (const item of items) {
      for (const d of [item.diagram, ...(item.patterns ?? []).map((p) => p.diagram)]) {
        const laid = layout(d) as unknown as { edges?: { id?: string; d?: string }[] };
        for (const e of laid.edges ?? []) {
          out.push({ 出どころ: `${分類}/${item.id}`, id: e.id ?? "?", d: e.d ?? "" });
        }
      }
    }
  }
  return out;
}

describe("線を描かない矢印 (#2479)", () => {
  it("線を引く命令の有無を道筋から読める (植え込み対照)", () => {
    // #2200 が実測した 3 つの形。 辺を書くと道筋が 1 点だけになる
    expect(線が無い道筋("M 105 278 L 105 378"), "線がある道筋を無いと答えている").toBe(false);
    expect(線が無い道筋("M 180 203"), "線が無い道筋を見逃している").toBe(true);
    expect(線が無い道筋("M 30 203"), "線が無い道筋を見逃している").toBe(true);
    // 曲線も線として数える
    expect(線が無い道筋("M 0 0 C 10 10 20 20 30 30"), "曲線を線として数えていない").toBe(false);
    // 閉じるだけの道筋は線を引かない (運んだ点に戻るだけ)
    expect(線が無い道筋("M 10 10 Z"), "閉じるだけの道筋を線ありと答えている").toBe(true);
    // 空は「描かない」 意図と区別が付かないので数えない
    expect(線が無い道筋(""), "空の道筋を数えている").toBe(false);
    expect(線が無い道筋("   "), "空白だけの道筋を数えている").toBe(false);
  });

  it("実物の矢印を 1 本以上走らせている (検査の空振り検知)", async () => {
    const 全件 = await 実物の矢印();
    // 本数そのものを判定に使う。 組み立てが壊れて 0 本になった回は「該当なし」 ではない
    expect(全件.length, "矢印を 1 本も集められていない (組み立てが壊れている)").toBeGreaterThan(
      100,
    );
    expect(
      全件.filter((e) => e.出どころ.startsWith("parts/")).length,
      "parts 分類の矢印が 1 本も入っていない (待ち忘れ)",
    ).toBeGreaterThan(0);
  });

  it("線を描かない矢印が 1 本も無い", async () => {
    const 全件 = await 実物の矢印();
    const 線無し = 全件.filter((e) => 線が無い道筋(e.d));
    expect(
      線無し.map((e) => `${e.出どころ} ${e.id} d="${e.d}"`),
      `線を描かない矢印がある (走った矢印 ${全件.length} 本)`,
    ).toEqual([]);
  });
});
