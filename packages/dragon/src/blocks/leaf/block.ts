/**
 * 葉のブロック (#3233、#3348)。
 *
 * 木の図の部品 (`only: tree`)。段の中の `leaf <名札> [hash: <hash>]` の行で、その段に葉の箱を出す。
 * `hash` を書くと箱に値を出し、名札を葉の下の札に出す。葉は書いた順に左から並ぶ。
 * 木の図に葉が 1 つも無い誤りは、全ての行を読んだ後に、このブロックの読み方 (`read.ts`) の `finish` が確かめる。
 */
import type { Block } from "../block";

export interface TreeLeaf {
  type: "leaf";
  id: string;
  hash?: string;
}

export const block: Block = {
  name: "leaf",
  rank: 97,
  attach: { how: "place", only: "tree" },
  words: { heads: ["leaf"], attrs: { leaf: ["hash"] } },
  // 木の図に葉が要る決まりと、線の端に木の箱を書ける決まりを持つ
  always: true,
};
