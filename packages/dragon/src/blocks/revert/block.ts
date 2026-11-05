/**
 * 取り消しのブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。段の中の `revert <落ちた者>: <理由>` の行で、今いちばん内側で開いている呼び出しを落として閉じ、
 * その呼び出しの内側で起きた変更 (槽、値の札、イベント) を元へ戻して取り消しの印で描く。
 * 落ちた呼び出しを呼んだ側に `revert` が無ければ、呼んだ側が受け止めて続けたと読み、呼んだ側の変更は暫定のまま残る。
 */
import type { Block } from "../block";

/** 段の中の、今いちばん内側で開いている呼び出しの呼ばれた者 `box` が `reason` で落ちる出来事 */
export interface PipeRevert {
  type: "revert";
  box: string;
  reason?: string;
}

export const block: Block = {
  name: "revert",
  rank: 128,
  attach: { how: "connect", only: "pipe" },
  words: { heads: ["revert"] },
};
