/**
 * 確認のブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。段の中の `check <行う者>: <左> <比べ方> <右>` の行で、その段だけ行う者の列に計器を描き、
 * 段の後は計器を消して、図の上の確認の印と行う者の印に結果を残す。比べ方は `>=`、`<=`、`>`、`<`、`==`、`!=` のどれか。
 * 両側が数 (`0.05 WETH` のように単位を添えてよい) なら dragon が比べて通るか落ちるかを決め、数でない確認は `[fail]` を書いた時だけ落ちる。
 */
import type { Block } from "../block";

/** 比べ方。長い記号から順に探す */
export const CHECK_OPS = [">=", "<=", "==", "!=", ">", "<"] as const;
export type CheckOp = (typeof CHECK_OPS)[number];

/** 段の中の、`box` が `left` と `right` を `op` で比べる出来事。`fail` は数でない確認が落ちる印 */
export interface PipeCheck {
  type: "check";
  box: string;
  left: string;
  op: CheckOp;
  right: string;
  fail?: true;
}

export const block: Block = {
  name: "check",
  rank: 125,
  attach: { how: "attach-to-box", only: "pipe" },
  words: { heads: ["check"], attrs: { check: ["fail"] } },
};
