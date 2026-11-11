/**
 * 表どうしの関係の図 (`er`、#3618) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと線の太さと間をここと `values.ts` から読む。
 * 表どうしの関係の図の並べ方と描き方 (`kinds/er/layout.ts` と `render/er.ts` と表のブロックの描き方) は後から読む塊にあるので、
 * 回り続ける図と同じく `values.ts` の `LOOK` と `TYPE` に入れず、表どうしの関係の図を描かない頁が最初に読む script にこの値を持たせない。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (表を横 1 列に並べ、結びの線で行どうしを繋ぎ、値の札が線を渡る)。
 */
import type { ColorKey, TextStyle } from "./values";

const text = (size: number, weight: number, family: TextStyle["family"] = "sans"): TextStyle => ({ size, weight, family });

/**
 * 表どうしの関係の図の字。表の名前 (`title`)、項目の名前 (`field`)、項目の値 (`value`、和文を含む値は `valueJa`)、
 * 鍵と結びの印 (`mark`)、式の札の項目の名前 (`caption`) と式 (`note`、和文を含む式は `noteJa`)。
 * 値と式は桁が揃うよう等幅の字で書き、和文を含む物だけ和文の字で書く
 */
export const ER_TYPE = {
  title: text(15, 700),
  field: text(12.5, 600),
  value: text(12.5, 600, "mono"),
  valueJa: text(12.5, 600),
  mark: text(10.5, 700, "mono"),
  caption: text(11, 600),
  note: text(14, 700, "mono"),
  noteJa: text(14, 700),
} as const;

/** 表に配る色の役。書いた順に配る。案Aの 4 つの表の色の順で、表は 6 つまでなので 6 つ持つ */
export const ER_COLORS: readonly ColorKey[] = ["blue", "violet", "amber", "green", "rose", "slate"];

/**
 * 図の外周の余白 `pad`。
 * `table` は表で、幅の下限 `minW`、左右の内の余白 `padX`、見出しの高さ `headH`、項目の行の高さ `rowH`、最後の行の下の余白 `bottom`、
 * 項目の名前と値の間の最小の隙間 `valueGap`、印と項目の名前の間 `markGap`、見出しの名前と段の番号の間 `titleGap`、角の丸み `radius`、
 * 選んだ行の地を表の横の縁から内へ寄せる幅 `pickInset` (丸めた角と落とした角から地がはみ出さない幅) と地の角の丸み `pickRadius`。
 * `mark` は鍵と結びの印の札で、高さ `h`、字の左右の余白 `padX`、角の丸み `radius`、2 つ並べる時の間 `gap`。
 * `gap` は隣どうしの表の間で、最小の幅 `least`、表の縁から線が縦に折れる所までの最小の長さ `end`、
 * 同じ間を通る線どうしの縦の道の間 `track` (並んだ線が近すぎない間)、札と表の縁の間 `clear`。
 * `end` は線の端の印で、1 件の側の縦の棒の、表の縁からの離れ `bar` と半分の長さ `barHalf`、
 * 何件もの側の三つ叉の、表の縁から根元までの長さ `fork` と開きの半分 `spread`。
 * `lane` は隣でない表どうしの線が通る、表の下の道で、表か式の札から最初の道まで `gap`、道どうしの間 `step`。
 * `note` は式の札で、表の下の縁から札まで `gap`、字の左右の余白 `padX`、高さ `h`、項目の名前の基準線 `captionY` と式の基準線 `textY`、
 * 同じ段に同じ表へ重ねる札どうしの間 `stack`、札から表へ向ける矢じりの長さ `head` と開きの半分 `half`。
 * `badge` は段の番号で、表の右の縁から一番右の丸の真ん中まで `inset`、同じ表に並べる丸の真ん中どうしの間 `step`。
 * `stroke` は線の太さで、結びの線 `link`、光った結びの線 `lit`、札が走る段の線 `run`、選んだ表の太い枠 `now`、選んだ後の枠 `kept`、式の札への矢 `arrow`。
 * `mix` は色の役を表の地に混ぜる割合 (%) で、見出し `head`、選んだ行 `pick`、印の地 `mark`、式の札の地 `note`
 */
export const ER_LOOK = {
  pad: 24,
  table: { minW: 168, padX: 14, headH: 40, rowH: 30, bottom: 6, valueGap: 18, markGap: 8, titleGap: 10, radius: 12, pickInset: 4, pickRadius: 6 },
  mark: { h: 16, padX: 5, radius: 4, gap: 4 },
  gap: { least: 64, end: 20, track: 22, clear: 6 },
  end: { bar: 9, barHalf: 8, fork: 13, spread: 7 },
  lane: { gap: 26, step: 26 },
  note: { gap: 22, padX: 14, h: 52, captionY: 19, textY: 40, stack: 10, head: 7, half: 5 },
  badge: { inset: 22, step: 29 },
  stroke: { link: 1.6, lit: 2, run: 3.2, now: 2.6, kept: 1.4, arrow: 1.4 },
  mix: { head: 14, pick: 18, mark: 16, note: 8 },
} as const;
