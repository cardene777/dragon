/**
 * 集合の重なりの図 (`venn`、#3620) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと線の太さと間をここと `values.ts` から読む。
 * 集合の重なりの図の並べ方と描き方 (`kinds/venn/layout.ts` と `render/venn.ts` と集まりの円のブロックの描き方) は後から読む塊にあるので、
 * 量の図と同じく `values.ts` の `LOOK` と `TYPE` に入れず、集合の重なりの図を描かない頁が最初に読む script にこの値を持たせない。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (円を段ごとに足し、重なった区画を光らせて数を書く)。
 */
import type { TextStyle } from "./values";

const text = (size: number, weight: number, family: TextStyle["family"] = "sans"): TextStyle => ({ size, weight, family });

/**
 * 集合の重なりの図の字。円の外の集まりの名前 (`name`) と全体の数 (`total`)、区画の中のそれぞれだけの数 (`region`)、
 * 重なりの数とどれにも入らない数の札 (`chip`)。数は桁が揃うよう等幅の字で書き、札は和文を含むので和文の字で書く
 */
export const VENN_TYPE = {
  name: text(15, 700),
  total: text(13, 600, "mono"),
  region: text(15, 700, "mono"),
  chip: text(12.5, 700),
} as const;

/**
 * 図の外周の余白 `pad`。
 * `circle` は円で、半径 `r`、隣どうしの円の真ん中の間を半径の何倍にするか `apart`、円の線の太さ `stroke`、円の地の濃さ `fill`。
 * `lit` は光らせた重なりの区画の地の濃さ。
 * `label` は円の外の名前と数で、円の縁との間 `gap`、名前の基準線から数の基準線までの行の送り `row`。
 * `chip` は重なりの数とどれにも入らない数の札で、高さ `h`、字の左右の余白 `padX`、角の丸み `radius`、線の太さ `stroke`、円の縁との間 `gap`、
 * 札と区画の数を結ぶ点線の太さ `lead` と点線の刻み `dash`。
 * `frame` はどれにも入らない数を出す円の外の枠で、中の物との間 `pad`、角の丸み `radius`、線の太さ `stroke`、地の濃さ `fill`。
 * `badge` は段の番号で、名前か札の端との間 `gap`。
 * `place` は区画の数の置き場所を探す格子の刻み `grid`
 */
export const VENN_LOOK = {
  pad: 24,
  circle: { r: 112, apart: 1.25, stroke: 2, fill: 0.1 },
  lit: 0.34,
  label: { gap: 10, row: 19 },
  chip: { h: 24, padX: 10, radius: 12, stroke: 1.5, gap: 18, lead: 1.4, dash: 4 },
  frame: { pad: 18, radius: 18, stroke: 1.6, fill: 0.06 },
  badge: { gap: 8 },
  place: { grid: 2 },
} as const;
