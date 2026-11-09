/**
 * 作業の棒のブロック (#3562)。
 *
 * 時間軸の図の部品 (`only: time`)。最初の `step` より前の `task <名札> as <名前> <範囲> [color: <色>]` の行で、作業を 1 つずつ宣言する。
 * 作業は自分の行を持ち、範囲の目盛りの上に続いた太い棒で描かれる。行の左に作業の名前、棒の中に期間の字が出て、針が通った分の棒が濃く塗られる。
 * 範囲は印の列の `mark` と同じく 0 から数える目盛りで、`0-2` か `13` と書く。
 * 作業の行と印の列 (`row`) の行は、宣言した順に上から並ぶ。印の列の後ろに書いた作業は、直前の印の列の名札を `after` に持つ。
 * 作業を持つ図は印の列を持たなくても描ける。印の列も作業も無い誤りは、目盛りのブロックの読み方 (`scale/read.ts` の `settle`) が確かめる。
 */
import type { TimeRow } from "../../schema";
import type { Block } from "../block";
import type { Color } from "../color/block";

/** 時間軸の図の作業。`from` から `to` の目盛りの上に棒を引く。`after` は直前に宣言した印の列の名札で、無ければ印の列より上に置く */
export interface TimeTask {
  id: string;
  name: string;
  from: number;
  to: number;
  color?: Color;
  after?: string;
}

export const block: Block = {
  name: "task",
  // 印の列 (`row`、91) と同じ並びにし、語の表と書き戻しで印の列の直ぐ後ろに並べる
  rank: 91,
  attach: { how: "place", only: "time" },
  words: { heads: ["task"], attrs: { task: ["color"] } },
};

/**
 * 時間軸の図の作業と印の列の行を、宣言した順に並べる。印の列を `after` に持たない作業 (名札が印の列に無い作業も) を上に置き、
 * 印の列ごとにその後ろへ、その列を `after` に持つ作業を書いた順に置く。
 * 書き戻す処理 (`read.ts`) と時間軸の図の並べ方 (`kinds/time/layout.ts`) が使う。並べ方が読む処理を読まないよう、定義と共に置く
 */
export function timeLines(rows: readonly TimeRow[], tasks: readonly TimeTask[]): ({ row: TimeRow } | { task: TimeTask })[] {
  const known = new Set(rows.map((row) => row.id));
  return [
    ...tasks.filter((t) => t.after === undefined || !known.has(t.after)).map((task) => ({ task })),
    ...rows.flatMap((row) => [{ row }, ...tasks.filter((t) => t.after === row.id).map((task) => ({ task }))]),
  ];
}
