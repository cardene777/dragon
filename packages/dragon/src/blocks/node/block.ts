/**
 * 組んだ親のブロック (#3233、#3348)。
 *
 * 木の図の部品 (`only: tree`)。段の中の `node <名札> of <子>, <子> [hash: <hash>]` の行で、前に書いた葉か親を子にして親の箱を出し、
 * 子と親を木の線で結ぶ。2 つの木の箱を結ぶので、付け方はつなぐ (接続ブロック)。
 * 木の箱の親は 1 つだけで、最後の段を終えた時に親を持たない木の箱は根の 1 つだけ。根が 2 つ以上残る誤りは、
 * 全ての行を読んだ後に、このブロックの読み方 (`read.ts`) の `verify` が確かめる。
 */
import type { Block } from "../block";

export const OF = "of";

/** 木の図の、1 つ以上の子から親を組む出来事。書いた段で親の箱と、子から親への木の線が現れる */
export interface TreeNode {
  type: "node";
  id: string;
  children: string[];
  hash?: string;
}

export const block: Block = {
  name: "node",
  rank: 98,
  attach: { how: "connect", only: "tree" },
  words: { heads: ["node"], attrs: { node: ["hash"] } },
  // 木の図の親を持たない箱が 1 つだけの決まりを持つ
  always: true,
};
