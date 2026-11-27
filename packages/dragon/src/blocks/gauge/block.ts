/**
 * 量の目盛りのブロック (#3880)。
 *
 * 上限のある量を、段ごとに動く横の棒で見せる。最初の `step` より前に `gauge <名札> as <名前> [on: <箱>, limit: <数>, unit: <単位>, over: <字>]` で目盛りを宣言し、
 * 段の中の `set <目盛り>: <総量>` で値を書く。値はその段の総量で、書かない段は前の段の値を保ち、前より小さい値を書いた段で棒が縮む。
 * `set <目盛り>: <確定> [hold: <予約>]` と書くと、確定した量を濃い色、続けて予約した量を同じ色の淡い塗りで塗り、総量は 2 つの合計になる。
 * `hold` を書かない `set` は予約を 0 に戻す。予約は上限 (`limit`) を書いた目盛りにだけ書ける (#3895)。
 * 目盛りは `on` で指した箱のすぐ下に置き、`on` を書かない目盛りは図の上の帯に置き、同じ箱の目盛りは宣言した順に縦に積む。
 * 上限 (`limit`) を書かない目盛りは棒を描かず、値と単位だけを出す。上限を超えた段の札の字は `over` で替えられる。
 * 行の頭の語 `set` は中身の帯のブロックが持つ語なので、目盛りの名札を書いた `set` の行はこのブロックが行の形 (`lines`) で先に読み、
 * ほかの `set` の行は中身の帯の欄の値として読む。
 * 今は手順の図 (`flow`) と列の図 (`lineup`) にだけ置け、2 つの図の種類の並べ方が箱の下と図の上の帯に目盛りの置き場を空ける。
 * 原本の JSON では `blocks` の `gauge` の欄に宣言の並びを、段の中の出来事 (`type` が `gauge`) に目盛りの名札 (`gauge`) と値 (`value`) と予約の量 (`hold`) を持つ。
 */
import type { Attr } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { Block } from "../block";

/** 目盛りの宣言。`on` は目盛りを置く箱、`limit` は上限、`unit` は値の後ろに出す単位、`over` は上限を超えた段の札の字 */
export interface Gauge {
  id: string;
  name: string;
  on?: string;
  limit?: number;
  unit?: string;
  over?: string;
}

/**
 * 目盛り `gauge` の値を `value` にする出来事。`hold` を持たない時、値はその段の総量。
 * `hold` を持つ時、`value` は確定した量、`hold` は予約した量で、総量は 2 つの合計 (#3895)
 */
export interface GaugeSet {
  type: "gauge";
  gauge: string;
  value: number;
  hold?: number;
}

/** 読んでいる記法の、宣言した目盛りと、その行と名札と `on` の位置。全ての宣言を読んでから確かめる時に、誤りの行と列を示す */
export interface GaugeDraft {
  gauge: Gauge;
  source: SourceLine;
  idAt: number;
  on?: Attr;
}

/** 目盛りの行に書ける属性の鍵 */
export const GAUGE_ATTRS: readonly string[] = ["on", "limit", "unit", "over"];

export const block: Block = {
  name: "gauge",
  rank: 31,
  attach: { how: "attach-to-figure", except: ["architecture", "cards", "chart", "checkout", "cycle", "er", "git", "matrix", "mind", "pipe", "sankey", "sequence", "state", "time", "tree", "try", "venn"] },
  words: { heads: ["gauge"], attrs: { gauge: GAUGE_ATTRS } },
  // 目盛りの名札を書いた `set` の行は、中身の帯の欄の値でなく目盛りの値として読む
  lines: [{ heads: ["set"] }],
};
