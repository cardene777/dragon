/**
 * 待ち行列のブロック (#3337、#3348)。
 *
 * 試す図の部品 (`only: try`)。最初の `step` より前の `queue <名札> [order: <欄>, accept: <名前>]` の行で、チップが待つ行列を宣言する。
 * `order` を書くとその欄の値の高い順に上から並べ、書かなければ入った順に並べる。欄は入力の帯の欄 (最初の欄を除く) で、全ての宣言を読んでから確かめる。
 * `accept` を書くと、入力の帯はその名前のチップだけをこの待ち行列へ送れる (#3453)。2 つ以上の名前は `accept: "<名前>, <名前>"` と囲む。
 * 試す図の段の中の `line <待ち行列か機械の列>: <チップ>, <チップ>` の行は、列の図の並びでなく部品の中身を書くので、
 * 列の並びのブロックでなくこのブロックの読み方 (`readTryLine`) で読む。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "queue",
  rank: 108,
  attach: { how: "place", only: "try" },
  words: { heads: ["queue"], attrs: { queue: ["order", "accept"] } },
  // 試す図の `line` の行は待ち行列か機械の列の中身を書くので、列の図の並びのブロックでなく待ち行列のブロックが読み、書き戻す
  lines: [{ heads: ["line"] }],
};
