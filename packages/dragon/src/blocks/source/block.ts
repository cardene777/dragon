/**
 * 出典のブロック (#3199、#3345)。
 *
 * 段の中に `source <名前> [url: <URL>]` の行で書き、1 つの段に何行でも書ける。
 * 原本の JSON では段の `sources` に書いた順に並び、出典を書かない段は欄を持たない。
 * 図の SVG には描かず、頁に置いた図の読み上げの段の一覧に、名前を URL への link にして出す (`draw.ts`)。
 * どの図の種類の段にも書けるコアブロックで、図に付く。
 * URL は箱の飛び先と同じく、頁を移る形 (`/` で始まる path か、`http://` か `https://` で始まる URL) だけを受ける。
 */
import type { Block } from "../block";

export interface StepSource {
  name: string;
  url: string;
}

/** `source` の行に書ける属性の鍵 */
export const ATTRS = ["url"] as const;

export const block: Block = {
  name: "source",
  rank: 50,
  attach: { how: "attach-to-figure", except: ["try"] },
  words: { heads: ["source"], attrs: { source: ATTRS } },
};
