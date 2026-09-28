/**
 * 記法の説明が、実装の受け付ける値をすべて出していることの検査 (#2659)。
 *
 * 項目 (`type:` / `shape:` 等) が説明に載っているかは
 * `lib/values-example.test.tsx` が見ている。 ここが見るのは **その項目が取る値**。
 *
 * ## なぜ要るか
 *
 * 型 9 つを `chart` と `shape:` に畳んだ時 (#2657)、図種の札から 9 つが消え、形の札を
 * 作らなかった。 結果 6 つの形 (`gauge` / `radial` / `stat` / `waffle` / `stacked` /
 * `slope`) が画面のどこにも出ない状態が 1 度も落ちずに残った。
 *
 * ## どこを走査するか
 *
 * **人が読む添え書きは母集団に入れない** (`rules/quality.md § 散文の語を判定材料に
 * しない`)。 配色の `生成り` は添え書きの文にだけ在り、書き写す相手になっていなかった =
 * 文を数えると「出ている」 と読めてしまう。
 *
 * 走査するのは書き手が値を置いた 3 か所だけ。
 *
 * | 置き場 | 取り方 |
 * |---|---|
 * | 節の例文 (`data-syntax-code`) | 区切りで分ける。 `-` では分けない |
 * | 札の一覧 (`v4-editor-syntax-chip`) | 札 1 つを丸ごと 1 語として扱う |
 * | 別名の行 (`v4-editor-syntax-code` と `data-notation`) | 正式名はそのまま、別名は ` / ` で分ける |
 *
 * 札を分けないのは、`chart-bar` の札が形の `bar` に当たってしまうため。 形の札を消しても
 * 箱の種類の札が代わりに当たり、検査が通り続ける。
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NODE_KINDS } from "@cardenelabs/cdl";
import {
  DIRECTION_ALIAS,
  DRAW_WORDS,
  ORDER_ALIAS,
  PALETTE_ALIAS,
  PRESET_TYPES,
  SHAPES,
  TONE_ALIAS,
} from "@cardenelabs/dragon";

import { SyntaxReference } from "./SyntaxReference";

/** 書いた markup から、その形に当たる中身をすべて取り出す */
function 取り出す(markup: string, 形: RegExp): string[] {
  return [...markup.matchAll(形)].map((m) => m[1] ?? "");
}

/** 節の例文に出る語だけ。 区切りで分ける (`-` では分けない) */
function 例文の語(markup: string): Set<string> {
  const 語 = new Set<string>();
  // markup では `"` が `&quot;` になるので、実体参照ごと区切りに含める
  for (const 行 of 取り出す(markup, /data-syntax-code="([^"]*)"/g)) {
    for (const t of 行.split(/(?:&quot;|&#x27;|[\s:,{}[\]"'])+/)) {
      if (t !== "") 語.add(t);
    }
  }
  return 語;
}

/**
 * 説明の中で「書き写す相手」 になっている語を集める。
 *
 * 例文だけ区切りで分ける。 札と別名は 1 つが 1 語なので分けない。
 */
function 書き写せる語(markup = renderToStaticMarkup(<SyntaxReference />)): Set<string> {
  const 語 = 例文の語(markup);

  // 札の一覧 (図種 / 形 / 箱の種類 / 起点から描ける図)
  for (const 札 of 取り出す(markup, /<code class="v4-editor-syntax-chip">([^<]*)<\/code>/g)) {
    語.add(札);
  }

  // 別名の行 (色 / 向き / 配色) の正式名
  for (const 名 of 取り出す(markup, /<code class="v4-editor-syntax-code[^"]*"[^>]*>([^<]*)<\/code>/g)) {
    語.add(名);
  }

  // 別名の行の別名。 `data-notation` が付いた添え書きだけが記法の語 (#2463)
  for (const 別名 of 取り出す(
    markup,
    /<span class="v4-editor-syntax-note" data-notation="">([^<]*)<\/span>/g,
  )) {
    for (const t of 別名.split(" / ")) 語.add(t);
  }

  return 語;
}

/**
 * 実装が受け付ける値の表。
 *
 * **値を手で書かない** (`rules/quality.md § 導出可能記述は人手で書かない`)。 実装の表を
 * そのまま並べるので、値を足した日に説明が取り残されればここが落ちる。
 */
const 値の表: Array<{ 名: string; 値: readonly string[] }> = [
  { 名: "図種", 値: [...PRESET_TYPES] },
  { 名: "形", 値: SHAPES },
  { 名: "箱の種類", 値: [...NODE_KINDS] },
  { 名: "起点から描ける語", 値: [...DRAW_WORDS] },
  { 名: "色", 値: Object.keys(TONE_ALIAS) },
  { 名: "向き", 値: Object.keys(DIRECTION_ALIAS) },
  { 名: "並び順", 値: Object.keys(ORDER_ALIAS) },
  { 名: "配色", 値: Object.keys(PALETTE_ALIAS) },
];

describe("記法の説明が実装の受け付ける値をすべて出す (#2659)", () => {
  it("走査した件数を出す", () => {
    const 語 = 書き写せる語();
    const 母数 = 値の表.reduce((n, t) => n + t.値.length, 0);
    console.log(`[記法の説明の値] 表=${値の表.length} 値=${母数} 件 / 書き写せる語=${語.size} 件`);
    // 0 件を主張する時に母数を併せて見る (`rules/quality.md § 0 件を報告する時は母数を併記する`)
    expect(母数, "値を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(100);
    expect(語.size, "説明から語を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(100);
  });

  for (const { 名, 値 } of 値の表) {
    it(`${名} の値が説明にすべて出る (${値.length} 件)`, () => {
      const 語 = 書き写せる語();
      const 出ない = 値.filter((v) => !語.has(v));
      expect(出ない, `${名} で説明に出ない値:\n${出ない.join("\n")}`).toEqual([]);
    });
  }

  it("札の一覧を外すと形が足りなくなる (植え込み対照)", () => {
    // 節の例文は形を 3 行しか出さない。 札の一覧が残りを覆っているので、札を外した
    // 母集団では形が欠ける = 上の検査が札を見ていることの裏取りになる
    const markup = renderToStaticMarkup(<SyntaxReference />);
    const 例文だけ = 例文の語(markup);
    const 例文に無い形 = SHAPES.filter((v) => !例文だけ.has(v));
    expect(
      例文に無い形.length,
      "例文だけで形が全部揃うなら、札の一覧を消しても検査は落ちない",
    ).toBeGreaterThan(0);
    expect(書き写せる語(markup).has(例文に無い形[0]!), "札の一覧が例文の抜けを覆う").toBe(true);
  });

  it("札を 1 語として数えている (分けると別の札に当たる)", () => {
    // `chart-bar` を `-` で分けると形の `bar` に当たり、形の札を消しても通り続ける
    const 語 = 書き写せる語();
    expect(語.has("chart-bar"), "箱の種類の札がそのまま 1 語になっている").toBe(true);
    // `shape-api-gateway` の札を分けると出る語。 どの表にも無いので、在れば分けている
    expect(語.has("gateway"), "札を `-` で分けている (分けると形の札が別の札に当たる)").toBe(false);
  });
});
