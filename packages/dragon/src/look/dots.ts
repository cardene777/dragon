/**
 * 点で数える見た目 (`[shape: dots]`、#3635) の見た目の値。量の図と集合の重なりの図が同じ値で描く。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと点の大きさと間をここと `values.ts` から読む。
 * 点で数える見た目の並べ方と描き方 (`layout/dots.ts` と `render/dots.ts`) は後から読む量の図と集合の重なりの図の塊にあるので、
 * `values.ts` の `LOOK` と `TYPE` に入れず、点で数える見た目を描かない頁が最初に読む script にこの値を持たせない。
 * 見た目の元は step 2 で本人が選んだ動く試作 (`.context/propose/dots/`) の案。重なりの点は扇形で塗り分け、量の図は点の行、携帯の幅は箱を上に置く。
 */
import type { TextStyle } from "./values";

const text = (size: number, weight: number, family: TextStyle["family"] = "sans"): TextStyle => ({ size, weight, family });

/**
 * 点で数える見た目の字。項目と集まりの名前 (`name`) と正確な件数 (`count`)、集まりの重なりの区画の件数 (`region`)、
 * 全体の箱の題 (`title`) と 1 点の件数 (`unit`)、どれにも入らない件数の札 (`none`)。件数は桁が揃うよう等幅の字で書く
 */
export const DOTS_TYPE = {
  name: text(15, 700),
  count: text(13, 600, "mono"),
  region: text(12.5, 700, "mono"),
  title: text(14, 700),
  unit: text(12.5, 500),
  none: text(12.5, 700),
} as const;

/**
 * 図の外周の余白 `pad`。
 * `dot` は点で、送り (隣の点の真ん中どうしの間) `pitch` と半径 `r` と、狭い枠で使う小さな点 `compact`。
 * `box` は全体の箱で、中の余白 `pad`、角の丸み `radius`、線の太さ `stroke`、空の点の列の数 `cols`、題の行と 1 点の件数の行の送り `row`、
 * 字と空の点の間 `holesGap`、空の点とどれにも入らない件数の札の間 `noneGap`、空の点の線の太さ `hole`。
 * `rows` は量の図の点の行で、枠の幅を書かない時に折り返す点の数 `cols`、枠に合わせる時の下限 `least` と上限 `most`、
 * 名前と点の間 `nameGap`、項目どうしの間 `gap`、名前の基準線から件数の基準線までの送り `countRow`。
 * `cluster` は集合の重なりの図の区画の点の群れで、群れどうしの間 `gap`、群れと区画の件数の字の間 `textGap`、群れと集まりの名前の間 `labelGap`。
 * `area` は点の群れと全体の箱の間 `gap`。`badge` は段の番号と字の間 `gap`。
 * `move` は点が寄る長さ、`stagger` は同じ段で寄る群れどうしをずらす間、`spread` はそのずれを全部で収める長さ、
 * `pop` は増えた点が弾む長さ、`popOver` は弾む時に一度なる大きさ、`fade` は減った点が消える長さ。
 */
export const DOTS_LOOK = {
  pad: 24,
  dot: { pitch: 18, r: 6.5, compact: { pitch: 15, r: 5.4 } },
  box: { pad: 14, radius: 12, stroke: 1.5, cols: 10, row: 20, holesGap: 12, noneGap: 18, hole: 1.1 },
  rows: { cols: 20, least: 10, most: 25, nameGap: 16, gap: 18, countRow: 19 },
  cluster: { gap: 22, textGap: 16, labelGap: 12 },
  area: { gap: 32 },
  badge: { gap: 10 },
  motion: { move: 0.7, stagger: 0.12, spread: 0.6, pop: 0.45, popOver: 1.22, fade: 0.3 },
} as const;
