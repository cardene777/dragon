/**
 * 槽のブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。最初の `step` より前の `hold <持ち主>: <量> <トークン>, <量> <トークン>` の行で、持ち主の列の下にトークンごとの槽を置き、
 * 段の中の `move <トークンの Contract>: <量> <送り手> -> <受け手>` の行で、そのトークンの管を通して送り手の槽から受け手の槽へ量を移す。
 * 発行 `mint <トークンの Contract>: <量> -> <受け手>` は受け手の槽だけを増やし、焼却 `burn <トークンの Contract>: <量> <持ち主>` は持ち主の槽だけを減らす (#3722)。
 * どちらもゼロのアドレスを関係者として描かず、原本では送り手か受け手を省いた `move` として持つ。
 * NFT と ERC-1155 は `#` の後をトークンの番号、前を数にし (`move art: #1 alice -> bob`、`move items: 2 #1 alice -> bob`)、数を省くと 1 つ。
 * 番号の付いた残高も `hold alice: #1 ART` と書き、番号ごとに槽を持つ。
 * 残高でない値は `hold <持つ Contract>: <名前> <値>` で宣言し、値の札のブロック (`write`) が札に描く。
 * トークンは `box usdc as USDC` の名前 (`USDC`) で書き、ETH だけは宣言しない決まった名前で、`move` では動かさず呼び出しの `[value]` で送る。
 * 量は書いた字のまま持ち、足し引きは桁を落とさない十進の数で行う (`pipe-run.ts`)。
 * 最初の `step` より前の `layout <形>` の行は、トークンの箱と槽の置き方を選ぶ (Tracelyth #165、#166、#168)。
 * 置き方の誤りの文を後から読むこの読み方に置き、最初に読む量を増やさないため、宣言の行の 1 つとしてここに持つ (#3720)。
 * 同じく最初の `step` より前の `route <人> -> <箱>` の行は、置き方が通り道を空ける呼び出しの組を 1 組ずつ渡す (#3721)。
 * `route` は試す図の網の行の頭の語でもあるので、頭の語でなく行の形 (`lines`) で読み、配管の図の行だけを読む
 */
import type { Block } from "../block";

/**
 * 値の持ち分の線 (Tracelyth #107、#133)。2人をキーに持つ値は別の2人の `from` と `to` を持ち、2人を結ぶ点線と札で描く。
 * 1人をキーに持つ値は `on` を持ち、その人の列の下に札を置く。どちらも線の札に出す単位 `unit` を足せる。
 * `tank` は数を残高と同じ槽で描く値 (Tracelyth #207) で、ほかの欄を持たない
 */
export type PipeHoldLink =
  | { from: string; to: string; unit?: string; on?: undefined; tank?: undefined }
  | { on: string; unit?: string; from?: undefined; to?: undefined; tank?: undefined }
  | { tank: true; from?: undefined; to?: undefined; on?: undefined; unit?: undefined };

/**
 * 始めの値。残高は持ち主とトークンと量と、NFT と ERC-1155 のトークンの番号 `tokenId`。残高でない値は持ち主と名前と値と、持ち分の線 `link`。
 * 量と値と番号は書いた字のまま
 */
export type PipeHold = { box: string; amount: string; token: string; tokenId?: string } | { box: string; name: string; value: string; link?: PipeHoldLink };

/**
 * 段の中の、トークンの Contract `box` が送り手 `from` の残高から受け手 `to` へ `amount` を移す出来事。
 * `from` を省くと受け手の槽だけを増やす発行 (`mint`)、`to` を省くと送り手の槽だけを減らす焼却 (`burn`) で、どちらか片方は必ず持つ。
 * `tokenId` は NFT と ERC-1155 のトークンの番号で、その番号の槽の量を動かす
 */
export interface PipeMove {
  type: "move";
  box: string;
  amount: string;
  from?: string;
  to?: string;
  tokenId?: string;
}

export const block: Block = {
  name: "hold",
  rank: 120,
  attach: { how: "place", only: "pipe" },
  words: { heads: ["hold", "move", "mint", "burn", "layout"] },
  lines: [{ heads: ["route"] }],
};
