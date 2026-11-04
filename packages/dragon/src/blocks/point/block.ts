/**
 * 節目のブロック (#3165、#3348)。
 *
 * 時間軸の図の部品 (`only: time`)。最初の `step` より前の `point <名札> at <目盛り>` の行で、その目盛りの印の下に旗の丸を置く。
 * 段の中の `note <節目>: <状態> [color: <色>]` の行で、節目の状態の字と丸の色を変え、節目どうしを線で結ぶ。
 * `note` の行の頭の語は下の字のブロックが持つので、時間軸の図の `note` の行は定義の `lines` で名指し、読み方 (`read.ts`) の `take` が `readTimeNote` で読む。
 * 時間軸の図の `note` の行は箱にも書け、`color` は節目にだけ書ける。
 */
import type { Block } from "../block";
import { NOW } from "../scale/block";

export const AT = "at";

/** 時間軸の図の節目。`at` の目盛りの印の下に旗の丸と名札を置く */
export interface TimePoint {
  id: string;
  at: number;
}

export const block: Block = {
  name: "point",
  rank: 92,
  attach: { how: "place", only: "time" },
  words: { heads: ["point"], attrs: { note: ["color"] } },
  // 時間軸の図の `note` の行は節目にも書けるので節目のブロックが読み、線の端には節目も書ける
  lines: [{ heads: ["note"] }, { edges: "any", exceptFrom: NOW }],
};
