/**
 * 列の並びのブロック (#3239、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。段の中の `line <列>: <チップ>, <チップ>` の行で、列 (箱) のチップを書いた順に並べ直す。
 * ほかの列に居たチップはその席から滑って来て、どこにも居なかったチップは弾んで現れ、列から外したチップは消える。
 * 列は箱なので、付け方は箱に付く。1 列に並べられるチップは 12 枚までで、封をした列の並びは開けるまで書けない。
 * 試す図の段の中の `line <部品>: <チップ>` の行は部品の中身を書くので、待ち行列のブロックが読む (#3337)。出来事の形と書き戻しは列の図と同じ `line` なので、このブロックが持つ。
 */
import type { Block } from "../block";

export const LANE_MOST = 12;

/** 列の図 (#3239) の、列 `box` の並びを `items` に書き換える出来事。前の段との差分を描く部品が滑る動きに変える */
export interface LineupOrder {
  type: "line";
  box: string;
  items: string[];
}

export const block: Block = {
  name: "line",
  rank: 100,
  attach: { how: "attach-to-box", only: "lineup" },
  words: { heads: ["line"] },
};
