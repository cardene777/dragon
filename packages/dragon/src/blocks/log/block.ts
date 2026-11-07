/**
 * 記録の列のブロック (#3441)。
 *
 * 試す図の部品 (`only: try`)。最初の `step` より前の `log <名札> [all: <欄> = <値>, yes: <印>, no: <印>]` の行で、記録を並べる列を宣言する。
 * 釦 (`press`) の `into` に書くと、釦は待ち行列の上から `take` 件を番号の付いた 1 つの記録にまとめる。
 * 記録は番号と中のチップだけを持ち、機械の列 (`chain`) と違って prev と hash を持たない。
 * `all` を書くと、記録の中のチップのその欄が全てその値なら `yes` の印を、1 つでも違えば `no` の印を記録に出す。欄は入力の帯の欄 (最初の欄を除く) で、全ての宣言を読んでから確かめる。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "log",
  rank: 109,
  attach: { how: "place", only: "try" },
  words: { heads: ["log"], attrs: { log: ["all", "yes", "no"] } },
};
