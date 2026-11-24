/**
 * 持ち主ごとのカードの図 (`cards`、#3846) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと線の太さと間をここと `values.ts` から読む。
 * 持ち主ごとのカードの図の並べ方と描き方 (`kinds/cards/layout.ts` と `render/cards.ts` と持ち主ごとのカードのブロックの描き方) は後から読む塊にあるので、
 * 量の行き先の図と同じく `values.ts` の `LOOK` と `TYPE` に入れず、持ち主ごとのカードの図を描かない頁が最初に読む script にこの値を持たせない。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (持ち主の縦の列を横に並べた板)。列の地と角の丸みと札の値は列の図のボード (`look/lineup.ts` の `board`) に揃える。
 */
import type { TextStyle } from "./values";

const text = (size: number, weight: number, family: TextStyle["family"] = "sans"): TextStyle => ({ size, weight, family });

/**
 * 持ち主ごとのカードの図の字。列の名前 (`name`) と名前の脇の添え書き (`sub`)、カードの名前 (`card`) と量 (`amount`)、
 * カードの上の縁に掛かる「できた」と「消えた」の札 (`tag`)、カードの印の札 (`mark`)、カードの無い列の字 (`empty`)、
 * 呼び出しの線の名前 (`call`)、断られた札の題 (`refused`) と理由 (`reason`)、合計の帯の「合計」の字 (`totalLabel`) と合計の量 (`total`) と前の量 (`was`)。
 * 量は桁が揃うよう等幅の字で書く
 */
export const CARDS_TYPE = {
  name: text(16, 700),
  sub: text(12.5, 500),
  card: text(15, 700),
  amount: text(14, 600, "mono"),
  tag: text(12, 700),
  mark: text(12, 700),
  empty: text(13, 500),
  call: text(12.5, 700),
  refused: text(14, 700),
  reason: text(13, 600),
  totalLabel: text(13, 500),
  total: text(15, 700, "mono"),
  was: text(12.5, 500, "mono"),
} as const;

/**
 * 図の外周の余白 `margin`。
 * `column` は持ち主の列で、幅の下限 `minW`、列どうしの間 `gap`、角の丸み `radius`、列の地の濃さ `tint`、見出しの地の濃さ `headTint`、
 * 見出しの高さ `headH`、名前の左端 `nameX` と基準線 `nameY`、名前と添え書きの間 `subGap`、カードの左右の余白 `padX`、
 * 呼び出しの線の無い図の見出しと最初のカードの間 `top`、最後の物と列の下の端の間 `bottom`。
 * `call` は呼び出しの線で、見出しと最初のカードの間に空ける高さ `room`、最初のカードへ真っ直ぐ下ろす線のカードの左端からの位置 `x`、
 * 2 枚目から後のカードへ回り込む線の列の左端からの位置 `rail`、線の名前の札の高さ `h` と字の左右の余白 `padX` と線との間 `gap`、角の丸み `radius`。
 * `card` はカードで、高さ `h`、上下の間 `gap`、角の丸み `radius`、字の左右の余白 `padX`、名前と量の基準線 `nameY` と `amountY`、量の無いカードの名前の基準線 `soloY`、
 * 縁の太さ `edge` と光った縁の太さ `strong`、消したカードの地の濃さ `gone`、消し線の太さ `strike`。
 * `tag` は「できた」と「消えた」の札で、高さ `h`、字の左右の余白 `padX`、カードの右の端から `inset`。
 * `mark` はカードの印の札で、高さ `h`、字の左右の余白 `padX`、カードの右の端から `inset`、地の濃さ `tint`、縁の濃さ `edge`。
 * `refusal` は断られた札で、列のカードの下に `gap` 空けて置く。高さ `h`、字の左右の余白 `padX`、題の基準線 `titleY`、× の印の真ん中の左端からの位置 `crossX` と半分の大きさ `cross`、題の左端 `textX`、
 * 理由の札の高さ `chip` と真ん中の上の端からの位置 `chipY`、角の丸み `radius`、地の濃さ `tint`。
 * `empty` はカードの無い列の点線の枠で、点線の模様 `dash`。
 * `total` は合計の帯で、列の下の端から `top`、量の行の高さ `row`、上下の余白 `padY`、字の左右の余白 `padX`、角の丸み `radius`、前の量と今の量の間 `gap`、
 * 変わった列の地の濃さ `tint`、消し線の太さ `strike`
 */
export const CARDS_LOOK = {
  margin: 20,
  column: { minW: 196, gap: 16, radius: 16, tint: 7, headTint: 12, headH: 50, nameX: 16, nameY: 31, subGap: 8, padX: 14, top: 14, bottom: 14 },
  call: { room: 40, x: 24, rail: 7, h: 22, padX: 11, gap: 9, radius: 11 },
  card: { h: 58, gap: 10, radius: 10, padX: 13, nameY: 24, amountY: 44, soloY: 34, edge: 1.1, strong: 2.2, gone: 55, strike: 2 },
  tag: { h: 20, padX: 9, inset: 10 },
  mark: { h: 20, padX: 8, inset: 9, tint: 14, edge: 45 },
  refusal: { gap: 4, h: 76, padX: 12, titleY: 25, crossX: 20, cross: 5, textX: 34, chip: 24, chipY: 52, radius: 12, tint: 8 },
  empty: { dash: [4, 4] },
  total: { top: 14, row: 22, padY: 12, padX: 14, radius: 12, gap: 8, tint: 16, strike: 1.6 },
} as const;
