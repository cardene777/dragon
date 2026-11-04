/**
 * 札のブロック (#3239、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。段の中の `stamp <列>: <字>` の行で、列の右に傾いた札を押す。
 * 署名や承認のように、列の中身に触れずに起きたことを見せる。
 */
import type { Block } from "../block";

export interface LineupStamp {
  type: "stamp";
  box: string;
  text: string;
}

export const block: Block = {
  name: "stamp",
  rank: 103,
  attach: { how: "attach-to-box", only: "lineup" },
  words: { heads: ["stamp"] },
};
