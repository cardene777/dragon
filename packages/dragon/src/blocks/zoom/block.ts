/**
 * 拡大の帯のブロック (#3165、#3348)。
 *
 * 時間軸の図の部品 (`only: time`)。最初の `step` より前の `zoom <目盛り>-<目盛り>` の行で、上の帯にその範囲の目盛りを列にして並べ、
 * 宣言した箱を列ごとに繰り返す。帯は図に 1 つなので、付け方は図に付く。
 * 箱どうしの線は `[at: <目盛り>]` で帯の列を選び、受ける箱を別の列から選ぶ時は `[into: <目盛り>]` を足す。線の列を読む処理 (`readColumns`) は、
 * 線のブロックが線の行を読む時に、読む処理の口 (`columns`) を通してこのブロックの読み方 (`read.ts`) を呼ぶ。節目どうしの線は軸の上に引くので列を持たない。
 * 時間軸の図の箱を宣言したのに帯が無い誤りは、最初の段を始める時に、このブロックの読み方の `settle` が確かめる。
 */
import type { Block } from "../block";
import { NOW } from "../scale/block";

export const TIME_EDGE_ATTRS = ["at", "into"] as const;

export const block: Block = {
  name: "zoom",
  rank: 93,
  attach: { how: "attach-to-figure", only: "time" },
  words: { heads: ["zoom"], attrs: { edge: [...TIME_EDGE_ATTRS] } },
  // 時間軸の図の箱は拡大の範囲に置き、箱どうしの線は拡大の帯の列 (`at`、`into`) を持つので、箱の行と線の行を読む時に確かめる
  lines: [{ heads: ["box"] }, { edges: "any", exceptFrom: NOW }],
};
