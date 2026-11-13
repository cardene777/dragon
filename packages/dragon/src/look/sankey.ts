/**
 * 量の行き先の図 (`sankey`、#3626) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと線の太さと間をここと `values.ts` から読む。
 * 量の行き先の図の並べ方と描き方 (`kinds/sankey/layout.ts` と `render/sankey.ts` と量の帯のブロックの描き方) は後から読む塊にあるので、
 * 量の図と同じく `values.ts` の `LOOK` と `TYPE` に入れず、量の行き先の図を描かない頁が最初に読む script にこの値を持たせない。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (全量の棒から幅を保った帯が右へ枝分かれし、量の札が帯を渡る)。
 */
import type { TextStyle } from "./values";

const text = (size: number, weight: number, family: TextStyle["family"] = "sans"): TextStyle => ({ size, weight, family });

/**
 * 量の行き先の図の字。箱の名前 (`name`)、棒の右に名前の下の行で書く量 (`amount`)、棒の上に名前と同じ行で書く量 (`lead`)。
 * 量は桁が揃うよう等幅の字で書く
 */
export const SANKEY_TYPE = {
  name: text(15, 700),
  amount: text(13.5, 500, "mono"),
  lead: text(13.5, 700, "mono"),
} as const;

/**
 * 図の外周の余白 `pad`。量が最も多い列の棒の高さの和 `height`。
 * `bar` は量の棒で、幅 `w` と角の丸み `radius`。`gap` は同じ列の箱どうしの間 (名前と量の字を含む)。`reach` は列どうしの間の最小の長さ。
 * `label` は箱の名前と量で、棒の右の縁と名前の間 `gap`、棒の上に置く時の名前の基準線と棒の上の縁の間 `above`、
 * 名前の基準線から下の行の量の基準線までの送り `row`、同じ行に置く名前と量の間 `apart`、字と次の列の棒の間に空ける最小の隙間 `clear`。
 * `badge` は段の番号で、名前か量の字の端と丸の縁の間 `gap`。
 * `chip` は量の札が渡る帯の道で、帯の曲線を出どころの縁 0 から行き先の縁 1 で数えた所の、走り出す所 `from` と留まる所 `to`。
 * `band` は帯の地の濃さで、伸びた段の間 `now` とその後 `lit`。`samples` は帯の曲線を区切る点の数
 */
export const SANKEY_LOOK = {
  pad: 24,
  height: 360,
  bar: { w: 18, radius: 3 },
  gap: 18,
  reach: 220,
  label: { gap: 12, above: 10, row: 21, apart: 8, clear: 24 },
  badge: { gap: 10 },
  chip: { from: 0.12, to: 0.7 },
  band: { now: 0.42, lit: 0.26 },
  samples: 24,
} as const;

/**
 * 段ごとの帯の見た目 (`[shape: rows]`、#3641) の字。区画の名前 (`name`)、区画の量 (`value`)、残りの量 (`rest`)、帯の下に並べる名前 (`list`)。
 * 量は桁が揃うよう等幅の字で書く
 */
export const SANKEY_ROWS_TYPE = {
  name: text(14, 700),
  value: text(13, 700, "mono"),
  rest: text(13, 500, "mono"),
  list: text(13, 500),
} as const;

/**
 * 段ごとの帯の見た目の値。見た目の元は step 2 で決めた案 (動く試作の案Bから、続いている区画の字と残りの点線の枠を減らした版)。
 * `width` は既定の幅の図の幅。`bar` は段ごとの帯で、高さ `h` と角の丸み `radius`。`gap` は隣の区画との隙間。
 * `drop` は上の行の帯の下の縁から下の行の帯の上の縁までの、下りる帯と量の札が通る間。`phone` は携帯の幅の時の図の外周の余白 `pad`、段の番号と帯の間 `badgeGap`、下りる帯の間 `drop`。
 * `padX` は区画の左の縁と字の間。`lines` は区画の名前の基準線から量の基準線までの送りで、`nameAt` は区画の上の縁から名前の基準線まで。
 * `badge` は段の番号で、丸の縁と帯の左の縁の間 `gap`。`chip` は量の札と、下りる帯の上の縁と下の縁の間の隙間。
 * `names` は帯の下に並べる名前で、帯の下の縁との間 `gap`、色の印の一辺 `mark` と角の丸み `markRadius`、印と字の間 `markGap`、名前どうしの間 `apart`、行の送り `row`。
 * `tint` は区画の地の濃さで、新しく分かれた区画 `now`、続いている区画 `carried`、残り `rest`、下りる帯 `drop`
 */
export const SANKEY_ROWS = {
  width: 868,
  bar: { h: 52, radius: 9 },
  gap: 6,
  drop: 56,
  phone: { pad: 14, badgeGap: 8, drop: 44 },
  padX: 10,
  nameAt: 22,
  lines: 18,
  badge: { gap: 12 },
  chip: 4,
  names: { gap: 10, mark: 10, markRadius: 2, markGap: 6, apart: 14, row: 20 },
  tint: { now: 0.32, carried: 0.14, rest: 0.2, drop: 0.16 },
} as const;

/**
 * 面積で割る四角の見た目 (`[shape: treemap]`、#3642) の字。区画の名前 (`name`)、区画の量 (`value`)、残りの量 (`rest`)、
 * 分けた区画の名前の札 (`chip`)、図の四角の下に並べる名前 (`list`)。量は桁が揃うよう等幅の字で書く
 */
export const SANKEY_TREEMAP_TYPE = {
  name: text(14, 700),
  value: text(13, 700, "mono"),
  rest: text(13, 500, "mono"),
  chip: text(13, 700),
  list: text(13, 500),
} as const;

/**
 * 面積で割る四角の見た目の値。見た目の元は step 2 で決めた案。
 * `width` は既定の幅の図の幅、`aspect` は図の四角の高さの幅に比べた割合。`phone` は携帯の幅の時の図の外周の余白 `pad` と高さの割合 `aspect`。
 * `gap` は隣の区画との隙間、`radius` は区画の角の丸み。`padX` は区画の左の縁と字の間、`nameAt` は区画の上の縁から名前の基準線まで、
 * `lines` は名前の基準線から量の基準線までの送り、`padY` は量の字の下の縁と区画の下の縁の間の下限。
 * `nest` は子の区画に分けた区画で、上の縁から子の区画まで `head` (名前の札を書く所)、札の基準線 `chipAt`、左右と下の縁から子の区画まで `inset`、枠の線の太さ `stroke`。
 * `badge` は段の番号で、丸の下の縁と図の四角の上の縁の間 `gap`。
 * `names` は図の四角の下に並べる名前で、図の四角の下の縁との間 `gap`、色の印の一辺 `mark` と角の丸み `markRadius`、印と字の間 `markGap`、名前どうしの間 `apart`、行の送り `row`。
 * `tint` は区画の地の濃さで、その段で切り出した区画 `now`、前の段の区画 `lit`、残り `rest`、子の区画に分けた区画の枠の中 `frame`。
 * `cut` は切る線の太さ `width` と濃さ `opacity`
 */
export const SANKEY_TREEMAP = {
  width: 868,
  aspect: 0.5,
  phone: { pad: 14, aspect: 1 },
  gap: 4,
  radius: 6,
  padX: 10,
  nameAt: 22,
  lines: 18,
  padY: 6,
  nest: { head: 22, chipAt: 15, inset: 3, stroke: 1.5 },
  badge: { gap: 8 },
  names: { gap: 10, mark: 10, markRadius: 2, markGap: 6, apart: 14, row: 20 },
  tint: { now: 0.34, lit: 0.2, rest: 0.16, frame: 0.07 },
  cut: { width: 2, opacity: 0.7 },
} as const;
