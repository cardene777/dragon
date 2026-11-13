/**
 * 2つの軸で置く図 (`matrix`、#3622) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと線の太さをここと `values.ts` から読む。
 * 2つの軸で置く図の並べ方と描き方 (`kinds/matrix/layout.ts` と `render/matrix.ts`) は後から読む塊にあるので、
 * 回り続ける図と同じく `values.ts` の `LOOK` と `TYPE` に入れず、2つの軸で置く図を描かない頁が最初に読む script にこの値を持たせない。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (矢印の軸で 4 つの区画に分け、左に並べた札を段ごとに区画へ動かす)。
 */
import type { ColorKey, TextStyle } from "./values";

const text = (size: number, weight: number): TextStyle => ({ size, weight, family: "sans" });

/**
 * 字。区画の名前 (`area`) と区画の下の字 (`sub`)、課題の札の名前 (`card`)、軸の名前 (`axis`) と両端の字 (`end`)、置く前の一覧の題 (`list`)。
 * 区画の名前を一番太く書き、どの区画かを先に読ませる
 */
export const MATRIX_TYPE = {
  area: text(15, 700),
  sub: text(12, 500),
  card: text(14, 500),
  axis: text(13, 700),
  end: text(12.5, 500),
  list: text(13, 700),
  // 点数で点を打つ見た目 (#3637)。目盛りの数 (`tick`)、点の横の課題の名前 (`dot`)、軸の上の点数の札 (`chip`)、
  // 置く前の課題の表の題 (`table`) と列の見出し (`th`) と課題の名前 (`td`) と点数 (`score`)
  tick: { size: 12.5, weight: 500, family: "mono" },
  dot: text(14, 600),
  chip: { size: 12.5, weight: 700, family: "mono" },
  table: text(15, 700),
  th: text(12.5, 700),
  td: text(14, 500),
  score: { size: 14, weight: 700, family: "mono" },
} as const satisfies Record<string, TextStyle>;

/**
 * 点数で点を打つ見た目 (#3637) の寸法。見た目の元は #3622 の step 2 で本人が選ばなかった動く試作の案B。
 * `plot` は点の図の枠の既定の幅 `w` と高さ `h`、狭い枠で縮める幅の下限 `minW` と、狭い枠での幅に対する高さの割合 `narrow`。
 * `axis` は軸の線を点の図の枠から伸ばす長さ `ext`、目盛りの長さ (5 の倍数の `major` とほかの `minor`)、目盛りと数の間 `gap`、
 * 数の行の高さ `row`、数の列の幅 `column`、軸の名前の行の高さ `name`、点の図の枠と縦の軸の名前の列の間 `aside`。
 * `dot` は点の半径 `r`、打った段に重ねる輪の半径 `ring`、点と名前の間 `gap`、同じ点に足す名前の行の間と、名前を点の上か下へずらす長さ `line`、名前の端が真ん中の線にかすめてよい長さ `graze`。
 * `chip` は軸の上の点数の札の高さ `h` と左右の余白 `padX`、角の丸み `radius`。
 * `table` は置く前の課題の表で、左右の余白 `padX`、題の行の高さ `head`、列の見出しの行の高さ `cols`、行の高さ `row`、最後の行の下の余白 `below`、
 * 段の番号の列の幅 `badge`、点数の列の幅の下限 `score`、角の丸み `radius`、点の図との間 `gap`、狭い枠で点の図の上に置く時の間 `stackGap`。
 * `dash` は区画を分ける真ん中の線の破線の長さと間。
 * `stroke` は線の太さで、点の図の枠 `frame`、真ん中の線 `mid`、目盛り `tick`、軸から点へ引く線 `guide`、点数の札の縁 `chip`、点の縁 `dot`、打った段の輪 `ring`。
 * `ring` は打った段の輪の濃さ
 */
const SCATTER = {
  plot: { w: 520, h: 380, minW: 240, narrow: 1 },
  axis: { ext: 16, major: 8, minor: 4, gap: 6, row: 18, column: 24, name: 22, aside: 6 },
  dot: { r: 8, ring: 16, gap: 22, line: 20, graze: 4 },
  chip: { h: 22, padX: 7, radius: 6 },
  table: { padX: 14, head: 44, cols: 28, row: 40, below: 8, badge: 34, score: 52, radius: 12, gap: 32, stackGap: 28 },
  dash: [5, 6],
  stroke: { frame: 1, mid: 1.4, tick: 1.4, guide: 1.6, chip: 1.4, dot: 2, ring: 2 },
  ring: 0.6,
} as const;

/**
 * 図の外周の余白 `pad`。
 * `list` は置く前の一覧の枠で、左右の余白 `padX`、題の行の高さ `head`、最後の札の下の余白 `below`、角の丸み `radius`。
 * `card` は課題の札で、高さ `h`、名前の左に空ける幅 `padL` (色の点を含む) と右に空ける幅 `padR`、色の点の半径 `dot` と札の左の縁から点の真ん中まで `dotX`、
 * 上下に並ぶ札の間 `gap`、角の丸み `radius`。
 * `area` は区画で、幅の下限 `minW` と高さの下限 `minH`、区画どうしの間 `gap`、左右の余白 `padX`、名前の行の高さ `head`、下の字の行の高さ `subH`、
 * 最後の札の下の余白 `below`、角の丸み `radius`。
 * `axis` は矢印の軸で、区画と軸の線の間 `gap`、軸の線と字の間 `text`、横の軸の字の行の高さ `row`、縦の軸の字の列の幅 `column`、
 * 字どうしの最小の間 `apart`、矢じりの後ろの角までの長さ `back` と開きの半分 `half`。
 * `badge` は段の番号の丸と、区画か一覧の上と右の縁の間 `inset`。
 * `baseline` は名前の字の基準線を、行の高さの真ん中から字の大きさの何割下げるか。
 * `colors` は区画の色で、書いた順の左上、右上、左下、右下に配る。課題の札は置いた区画の色になり、置く前は `idle` の色。
 * `tint` は区画の地の色の濃さで、いつもの `base` と、札を受けた段の間の `glow`。
 * `stroke` は線の太さで、軸 `axis`、区画の縁 `area`、札を受けた段の区画の縁 `glow`、札の縁 `card`、置いた段の札の縁 `now`
 */
export const MATRIX_LOOK = {
  pad: 24,
  list: { padX: 14, head: 44, below: 14, radius: 14 },
  card: { h: 36, padL: 30, padR: 16, dot: 5, dotX: 15, gap: 10, radius: 10 },
  area: { minW: 220, minH: 150, gap: 12, padX: 18, head: 44, subH: 18, below: 16, radius: 14 },
  axis: { gap: 12, text: 8, row: 20, column: 20, apart: 16, back: 9, half: 6 },
  badge: { inset: 8 },
  baseline: 0.34,
  colors: ["green", "blue", "amber", "slate"],
  idle: "slate",
  tint: { base: 0.08, glow: 0.24 },
  stroke: { axis: 1.6, area: 1.4, glow: 2.6, card: 1.4, now: 2.6 },
  scatter: SCATTER,
} as const satisfies {
  colors: readonly ColorKey[];
  idle: ColorKey;
  [key: string]: unknown;
};
