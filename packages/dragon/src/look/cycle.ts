/**
 * 回り続ける図 (`cycle`、#3623) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと線の太さをここと `values.ts` から読む。
 * 回り続ける図の並べ方と描き方 (`kinds/cycle/layout.ts` と `render/cycle.ts` と輪のブロックの描き方) は後から読む塊にあるので、
 * 量の図と同じく `values.ts` の `LOOK` と `TYPE` に入れず、回り続ける図を描かない頁が最初に読む script にこの値を持たせない。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (手順の箱を輪の上に置き、隣どうしを弧の矢印で結ぶ)。
 */
import type { TextStyle } from "./values";

const text = (size: number, weight: number, family: TextStyle["family"] = "sans"): TextStyle => ({ size, weight, family });

/**
 * 輪の真ん中の字。帯の題 (`title`)、最初の欄の値 (`lead`、和文を含む値は `leadJa`)、2 つ目からの欄の値 (`rest`)。
 * 最初の欄の値を大きく書き、今どの回かを一目で読ませる。最初の欄の和文を含まない値は、数字の桁が揃うよう等幅の字で書く。
 * 2 つ目からの欄の値は「始まりから4秒」のような短い文が多いので、和文の字で書く
 */
export const CYCLE_TYPE = {
  title: text(13, 700),
  lead: text(17, 700, "mono"),
  leadJa: text(16, 700),
  rest: text(13.5, 500),
} as const;

/**
 * 図の外周の余白 `pad`。
 * `ring` は輪で、半径の下限 `least` と、収まらない時に半径を広げる刻み `grow`、広げる上限 `most`。
 * 隣どうしの箱の間に空ける最小の隙間 `boxGap`、箱の縁と弧の端の間 `arcGap`、札と箱の縁の間 `chipGap`、
 * 札が走る道の最小の長さ `run`、札がいない弧の最小の長さ `bare`、輪の真ん中の字と箱か弧の間 `centreGap`、弧を区切る点の数 `samples`。
 * `head` は弧の真ん中に置く山形の矢じりで、後ろの角までの長さ `back`、開きの半分 `half`、先までの長さ `tip`。
 * `centre` は輪の真ん中の字の行の間で、題の基準線から最初の欄の値の基準線まで `lead`、最初の欄から次の欄まで `rest`、2 つ目からの欄どうし `row`。
 * `badge` は段の番号で、箱の横の縁と丸の縁の間 `beside`、弧を避けて丸を輪の外へずらす刻み `slide`、弧と丸の縁の間に空ける最小の隙間 `clear`。
 * `stroke` は線の太さで、弧 `arc`、光った弧 `lit`、その段で札が走る弧 `run`
 */
export const CYCLE_LOOK = {
  pad: 24,
  ring: {
    least: 96,
    grow: 4,
    most: 1200,
    boxGap: 28,
    arcGap: 6,
    chipGap: 6,
    run: 28,
    bare: 28,
    centreGap: 18,
    samples: 32,
  },
  head: { back: 6, half: 6, tip: 4 },
  centre: { lead: 26, rest: 24, row: 20 },
  badge: { beside: 8, slide: 4, clear: 5 },
  stroke: { arc: 2, lit: 2.25, run: 3.5 },
} as const;
