/**
 * 依存の型定義から、目当ての型を持つ file を 1 つに絞る (#1454)。
 *
 * 表を作る段が 2 つ (`gen-readout-table.mjs` / `gen-input-table.mjs`) あり、どちらも同じ形の
 * 絞り込みを持っていた。 案内の文面を片方だけ直すと、同じ状況で別のことを言う。
 *
 * ## 件数で原因が分かれる
 *
 * | 件数 | 意味 | 次の一手 |
 * |---|---|---|
 * | 0 件 | 依存が束ね方を変えた | 探し方を直す |
 * | 2 件以上 | **手元の install が汚れている** | `pnpm install --force` で入れ直す |
 *
 * 2 件以上が汚れを意味するのは、**公開されている全ての版が `render-*.d.ts` を
 * ちょうど 1 つしか持たない** ため (0.9.0 から 0.15.0 まで 9 版を実測)。
 * 配布物がそうなっている形はありえないので、手元で書き加わったことになる。
 *
 * #1448 はこの区別が無かったために、汚れを「作り方が変わった」 と読んで脇に置き、
 * 同じ汚れが別の形で返していた嘘 (種別が 2 つ多い) に気付けなかった。
 *
 * **判定は緩めない**。 1 つに決まらない時に止めるのは正しい (どの定義から出したのかが
 * 後から辿れなくなる)。 変えるのは止まった後に渡す情報だけ。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * `dist` から `目印` を含む `.d.ts` を 1 つ探す。
 *
 * @param {string} dist 依存の `dist` の場所
 * @param {string} 目印 その型定義にだけ現れる文字列 (例 `type CdlInput = {`)
 * @param {string} 名 案内に出す対象の名前 (例 `つまみ`)
 * @returns {string} 見つかった file の場所
 */
export function 型定義を1つ探す(dist, 目印, 名) {
  const 当たり = readdirSync(dist)
    .filter((f) => f.endsWith(".d.ts"))
    .map((f) => join(dist, f))
    .filter((p) => readFileSync(p, "utf8").includes(目印));
  if (当たり.length === 1) return 当たり[0];

  const 頭 = `${名}の型定義を持つ file が 1 つに決まりません (${当たり.length} 件)。 `;
  if (当たり.length === 0) {
    throw new Error(`${頭}描画側の束ね方が変わった可能性があります。 探している目印 = "${目印}"`);
  }
  throw new Error(
    `${頭}**手元の install が汚れています**。 公開されている版はどれも型定義を 1 つしか持たないため、` +
      ` 2 つ以上あるのは手元で書き加わったことを意味します。` +
      ` \`pnpm install --force\` で入れ直してください: ${当たり.join(", ")}`,
  );
}
