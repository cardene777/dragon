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

/**
 * 時計の文字盤の見た目 (#3638) の字。文字盤の外の手順の名前 (`name`) と長さ (`time`) と箱の下の字 (`sub`)、目盛りの数字 (`tick`、和文を含む数字は `tickJa`)、
 * 携帯の幅で文字盤の外に置く手順の番号 (`key`) と、下の一覧の番号と名前と長さ (`row`、`rowName`、`rowTime`)。
 * 数字と長さは桁が揃うよう等幅の字で書き、和文を含む字は和文の字で書く
 */
export const CLOCK_TYPE = {
  name: text(14.5, 700),
  time: text(12, 600, "mono"),
  sub: text(12.5, 500),
  tick: text(12, 700, "mono"),
  tickJa: text(12, 700),
  key: text(12.5, 700, "mono"),
  row: text(12.5, 700, "mono"),
  rowName: text(14, 700),
  rowTime: text(12.5, 600, "mono"),
} as const;

/**
 * 時計の文字盤の見た目 (#3638) の値。見た目の元は #3623 の step 2 で本人が選ばなかった動く試作の案B。
 * 文字盤は手順の弧の帯で、帯の内の半径の下限 `inner` と帯の幅 `band`、輪の真ん中の字と帯の内の縁の間 `centreGap`、弧どうしの間 `gap` (度)。
 * 段の番号は帯の内の縁から `badgeAt` の所の弧の上に置き、丸と弧の端の間を `badgeRoom` 空ける。入らない弧は番号を文字盤の外に置く。
 * 針は帯の内の縁から `handIn` 内の所から、帯の外の縁から `tip` 内の針の先まで伸び、針の先の丸の半径は `dot`。線の札は針の先に乗る。
 * 目盛りの印は帯の外の縁から `mark` の範囲に引き、数字の真ん中は外の縁から `tickAt` の所に置く。札の留まる所に掛かる数字は `slide` ずつ外へずらす。
 * 文字盤の外の名前は外の縁から `nameAt` の所から `slide` ずつ外へ、`farthest` まで探し、ほかの部品と `apart` 空ける。
 * 番号が弧に入らない手順の番号と名前は、弧の真ん中の向きから `shift` 度まで回した所まで探し、引き出す線をほかの部品から `leadClear` 離す。
 * 枠の幅が `wide` より狭い時は携帯の幅の並べ方にし、文字盤の下に `listGap` 空けて、高さ `row` の行の一覧を置く。行の頭の色の印の大きさは `swatch`。
 * `stroke` は線の太さで、針 `hand`、目盛りの印 `tick`、引き出す線 `lead`、弧の縁 `sector`。`tint` は光った弧の色の濃さ (%)。`samples` は札の道を区切る点の間の角 (度)
 */
export const CLOCK_LOOK = {
  pad: 24,
  inner: 104,
  band: 48,
  centreGap: 16,
  gap: 1,
  badgeAt: 15,
  badgeRoom: 3,
  handIn: 14,
  tip: 13,
  dot: 5,
  mark: [3, 9],
  tickAt: 22,
  nameAt: 40,
  slide: 3,
  farthest: 240,
  apart: 6,
  shift: 40,
  leadClear: 4,
  wide: 560,
  listGap: 20,
  row: 30,
  swatch: 10,
  stroke: { hand: 3, tick: 1.6, lead: 1.4, sector: 1 },
  tint: 30,
  samples: 3,
} as const;

/**
 * 輪を開いた帯の見た目 (#3639) の字。山形の下の手順の名前 (`name`) と箱の下の字 (`sub`)、帯の上の目盛りの数字 (`tick`、和文を含む数字は `tickJa`)、
 * 帯の頭の中身の帯の題 (`title`) と最初の欄の値 (`lead`、和文を含む値は `leadJa`) と 2 つ目からの欄の値 (`rest`)、
 * 携帯の幅で山形の中に書く手順の番号 (`key`) と、下の一覧の番号と名前と長さ (`row`、`rowName`、`rowTime`)。
 * 数字と長さは桁が揃うよう等幅の字で書き、和文を含む字は和文の字で書く
 */
export const BAND_TYPE = {
  name: text(14.5, 700),
  sub: text(12.5, 500),
  tick: text(12, 700, "mono"),
  tickJa: text(12, 700),
  title: text(13, 700),
  lead: text(16, 700, "mono"),
  leadJa: text(15, 700),
  rest: text(13, 500),
  key: text(12.5, 700, "mono"),
  row: text(12.5, 700, "mono"),
  rowName: text(14, 700),
  rowTime: text(12.5, 600, "mono"),
} as const;

/**
 * 輪を開いた帯の見た目 (#3639) の値。見た目の元は #3623 の step 2 で本人が選ばなかった動く試作の案C (`drawC`)。
 * 山形は左から右へ `pitch` の間で並べ、山形の先の深さは `point`、隣の山形との間は `gap`。山形の高さは `h` で、携帯の幅では `phoneH` にする。
 * 手順の名前が山形の間に収まらない時は、名前の幅に `nameGap` を足した間まで広げる。
 * 段の番号は山形の上の縁から `badgeAt` 上に置く。目盛りの数字の基準線は番号と同じ高さに置き、番号に掛かる時は `tickRow` 上の行へ移す。
 * 目盛りの印は数字の下から山形の上の縁の `mark` 手前まで引く。帯の頭の字の基準線は、番号と目盛りの上の端から `headGap` 上に置き、欄どうしは `fieldGap` 空ける。
 * 手順の名前の基準線は山形の下の縁から `nameAt` 下に置き、箱の下の字はその `subAt` 下に置く。
 * 戻る矢印は帯の右の端と左の端から `out` 外を回り、帯の下の字から `cross` 下を横切る。矢じりは長さ `head` で開きの半分 `headHalf`。
 * まだ来ていない回の帯は濃さ `faint` で出す。枠の幅が `wide` より狭い時は携帯の幅の並べ方にし、山形の中の番号の基準線を山形の上の縁から `keyAt` 下に置き、
 * 帯の下に `listGap` 空けて、高さ `row` の行の一覧を置く。行の頭の色の印の大きさは `swatch`。
 * `stroke` は線の太さで、山形の縁 `segment`、目盛りの印 `tick`、戻る矢印 `ret`。`tint` は光った山形の色の濃さ (%)
 */
export const BAND_LOOK = {
  pad: 24,
  pitch: 152,
  point: 14,
  gap: 6,
  h: 32,
  phoneH: 56,
  nameGap: 18,
  badgeAt: 20,
  tickRow: 22,
  mark: 3,
  headGap: 14,
  fieldGap: 12,
  nameAt: 22,
  subAt: 18,
  out: 18,
  cross: 22,
  head: 7,
  headHalf: 4.5,
  faint: 0.35,
  wide: 560,
  keyAt: 16,
  listGap: 20,
  row: 30,
  swatch: 10,
  apart: 6,
  stroke: { segment: 1.2, tick: 1.4, ret: 1.8 },
  tint: 30,
} as const;
