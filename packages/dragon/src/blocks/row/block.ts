/**
 * 印の列のブロック (#3165、#3348)。
 *
 * 時間軸の図の部品 (`only: time`)。最初の `step` より前の `row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>]` の行で、
 * 印の列を上から順に宣言する。目盛りごとに細い印が並び、針が過ぎた所から塗られる。`empty` に書いた目盛りは空きの印になる。
 * 段の中の `mark <列> <範囲> [color: <色>]` の行で、範囲の印の色を変える。
 * 印の列は箱と同じ名札を持てる (空いた目盛りの列でその箱を空きの枠にするため)。
 * 時間軸の図に印の列も作業の棒 (`task`、#3562) も 1 つも無い誤りは、最初の段を始める時に目盛りのブロックの読み方 (`scale/read.ts` の `settle`) が確かめ、その文をこのブロックの読み方が持つ。
 * 作業の棒を持つ図は印の列を持たなくても描け、印の列と作業の行は宣言した順に上から並ぶ。
 */
import type { Block } from "../block";
import type { Color } from "../color/block";

export interface TimeRow {
  id: string;
  name: string;
  color?: Color;
  empty?: number[];
}

/** 時間軸の図 (#3165) の、印の列 `row` の `from` から `to` の目盛りの印の色を変える出来事 */
export interface TimeMarkEvent {
  type: "mark";
  row: string;
  from: number;
  to: number;
  color: Color;
}

export const block: Block = {
  name: "row",
  rank: 91,
  attach: { how: "place", only: "time" },
  words: { heads: ["row", "mark"], headRanks: { mark: 95 }, attrs: { row: ["color", "empty"], mark: ["color"] } },
  // 時間軸の図に印の列が要る決まりを持つ
  always: true,
};
