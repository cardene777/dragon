/**
 * 機械の列のブロック (#3337、#3348)。
 *
 * 試す図の部品 (`only: try`)。最初の `step` より前の `chain <名札> [edit: <欄>]` の行で、ブロックの鎖を宣言する。
 * ブロックは 1 つ前のブロックの hash を prev に持ち、中身が変わると hash が変わってつながりが切れる。
 * `edit` を書くと、読み手がブロックの中のチップのその欄を書き換えられる。欄は入力の帯の欄 (最初の欄を除く) で、全ての宣言を読んでから確かめる。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "chain",
  rank: 109,
  attach: { how: "place", only: "try" },
  words: { heads: ["chain"], attrs: { chain: ["edit"] } },
};
