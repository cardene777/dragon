/**
 * 表のブロック (#3618)。
 *
 * 表どうしの関係の図の部品 (`only: er`)。最初の `step` より前の `table <名札> as <名前> [color: <色>]` の行で表を宣言し、
 * 次の `table` の行までの `field <名前>: <値> [key, ref: <表>.<項目>]` の行がその表の項目になる。表は 1 つから 6 つまで書ける。
 * `key` は鍵の印、`ref` は結びで、結びを書いた項目が多い側、指した項目が 1 件の側になる。前に書いた表も後ろに書いた表も指せる。
 * 段の中の `pick <表>.<項目>` で行と表の枠を光らせ、`set <表>.<項目>: <値>` で値を書き換え、`note <表>.<項目>: <文>` で式の札を添える。
 * 行の頭の語 `pick` は列の図、`set` は中身の帯、`note` は箱の下の字のブロックが持つ語なので、表どうしの関係の図のこの 3 つの行は
 * このブロックが行の形 (`lines`) で読み、ほかの種類の図の行の読み方を変えない。
 * 段の中の線は `ref` で結んだ項目どうしの線だけを受け、走る札は線の `[tag: <値>]` で書く。決まりは読み方 (`read.ts`) が持つ。
 * 原本では表を `blocks.table` に、段の中の 3 つの行を `lookup` と `cell` と `formula` の出来事に持つ。項目は `<表>.<項目>` の字で名指す
 */
import type { Block } from "../block";
import type { Color } from "../color/block";

/** 表の項目。`key` は鍵、`ref` は結びの先の `<表>.<項目>` */
export interface ErField {
  name: string;
  value: string;
  key?: true;
  ref?: string;
}

/** 表。`color` を書かない表は宣言した順に色の役を配る */
export interface ErTable {
  id: string;
  name: string;
  color?: Color;
  fields: ErField[];
}

/** 段の中で項目 `field` (`<表>.<項目>`) の行を選ぶ出来事 */
export interface ErLookup {
  type: "lookup";
  field: string;
}

/** 段の中で項目 `field` の値を `value` に書き換える出来事 */
export interface ErCell {
  type: "cell";
  field: string;
  value: string;
}

/** 段の中で項目 `field` に式の札 `text` を添える出来事 */
export interface ErFormula {
  type: "formula";
  field: string;
  text: string;
}

/** 1 つの図に書ける表の数 */
export const ER_TABLES = { least: 1, most: 6 } as const;

export const block: Block = {
  name: "table",
  rank: 146,
  attach: { how: "place", only: "er" },
  words: { heads: ["table", "field"], attrs: { table: ["color"], field: ["key", "ref"] } },
  // 表どうしの関係の図の決まり (書けない行を断る、表の数、結びの先) を持つ
  always: true,
  // 表どうしの関係の図の `pick` と `set` と `note` の行は、項目を名指す行として読む
  lines: [{ heads: ["table", "field", "pick", "set", "note"] }],
};
