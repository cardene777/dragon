/**
 * 槽のブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。最初の `step` より前の `hold <持ち主>: <量> <トークン>, <量> <トークン>` の行で、持ち主の列の下にトークンごとの槽を置き、
 * 段の中の `move <トークンの Contract>: <量> <送り手> -> <受け手>` の行で、そのトークンの管を通して送り手の槽から受け手の槽へ量を移す。
 * 残高でない値は `hold <持つ Contract>: <名前> <値>` で宣言し、値の札のブロック (`write`) が札に描く。
 * トークンは `box usdc as USDC` の名前 (`USDC`) で書き、ETH だけは宣言しない決まった名前で、`move` では動かさず呼び出しの `[value]` で送る。
 * 量は書いた字のまま持ち、足し引きは桁を落とさない十進の数で行う (`pipe-run.ts`)。
 */
import type { Block } from "../block";

/** 始めの値。残高は持ち主とトークンと量、残高でない値は持ち主と名前と値。量と値は書いた字のまま */
export type PipeHold = { box: string; amount: string; token: string } | { box: string; name: string; value: string };

/** 段の中の、トークンの Contract `box` が送り手 `from` の残高から受け手 `to` へ `amount` を移す出来事 */
export interface PipeMove {
  type: "move";
  box: string;
  amount: string;
  from: string;
  to: string;
}

export const block: Block = {
  name: "hold",
  rank: 120,
  attach: { how: "place", only: "pipe" },
  words: { heads: ["hold", "move"] },
};
