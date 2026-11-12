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
