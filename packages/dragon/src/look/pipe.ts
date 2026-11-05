/**
 * 配管の図 (`pipe`、#3389) の見た目の値。見た目の元は Tracelyth の第8回の試作 (`pipes2`)。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、配管の図の並べ方と描き方 (`kinds/pipe/layout.ts` と `render/pipe.ts`) だけが読む。
 * どちらも後から読む塊にあるので、`values.ts` の `LOOK` と `TYPE` に入れず別の file に分ける (列の図の `look/lineup.ts` と同じ訳)。
 */
import type { TextStyle } from "./values";

const text = (size: number, weight: number, family: TextStyle["family"] = "sans"): TextStyle => ({ size, weight, family });

/**
 * 配管の図の字。関係者の名前は箱の名前と同じ大きさにし、見せ方を選ぶ字の大きさ (`chooseView`) と揃える。
 * 量と値と比べる式は等幅、名前と題と字の札は和文も描ける字で描く
 */
export const PIPE_TYPE = {
  party: text(13, 650),
  initial: text(11, 700),
  head: text(10.5, 700),
  status: text(11.5, 700),
  chip: text(11, 700, "mono"),
  args: text(10.5, 500, "mono"),
  lane: text(11, 650),
  tankTitle: text(10.5, 700, "mono"),
  amount: text(16, 700, "mono"),
  was: text(10.5, 500, "mono"),
  tag: text(10.5, 700),
  plateName: text(10.5, 600, "mono"),
  plateValue: text(13, 700, "mono"),
  cardTitle: text(10.5, 600),
  cardValue: text(14, 700, "mono"),
  bus: text(10.5, 700, "mono"),
  fold: text(12.5, 700),
  hint: text(10.5, 500),
} as const;

/**
 * 配管の図の置き場所と部品の大きさ。単位は図の座標。
 *
 * - `margin` は外周の余白、`colGap` は関係者の列の間、`zoneGap` は上下の帯の間
 * - `head` は図の上の端の行 (確認の印と、右の今の段の変更の札)。`mark` は確認の印の一辺、`gap` は印の間、`labelGap` は字と印の間
 * - `status` は変更の札で、高さ `h`、左右の余白 `padX`、印の一辺 `icon`、印と字の間 `gap`
 * - `chip` はイベントの札で、高さ `h`、左右の余白 `padX`、札の間 `gap`、行の間 `rowGap`、名前と引数の間 `argsGap`
 * - `lane` は呼び出しの管で、深さごとの段差 `pitch`、一番上の管の上に取る字の札の高さ `room`、一番下の管から名札まで `below`、
 *   太さ `width` (書き込めない呼び出しは半分)、光の太さ `halo`、字の札の高さ `tagH` と左右の余白 `tagPadX` と管からの離れ `tagGap`、
 *   矢じりの長さ `arrow`、名札の端から最初の口まで `port`、閉じた管の点線 `closed`、処理を借りる管の芯の割合 `core`
 * - `pill` は関係者の名札で、高さ `h`、左右の余白 `padX`、印の一辺 `avatar`、印と名前の間 `gap`、畳んだ列の帯の幅 `strip`、
 *   確認の印の一辺 `lamp` と印をずらす量 `lampStep`、名札の上の端から印の真ん中まで `lampY`
 * - `card` は名札の下の札 (計器、換算、取り消し、畳んだ箱) で、名札からの離れ `top`、高さ `h`、左右の余白 `padX`、札の間 `gap`、印の一辺 `icon`、
 *   題と値の基準線 `titleY` と `valueY`
 * - `plate` は値の札で、高さ `h`、左右の余白 `padX`、札の間 `gap`、名前と値の基準線 `nameY` と `valueY`、値と前の値の間 `wasGap`
 * - `tank` は槽で、幅の下限 `w`、ガラスの高さ `h`、槽の間 `gap`、ガラスの内側の余白 `inner`、名前と量と前の量の行の送り `titleY`・`amountY`・`wasY`、
 *   前の量からガラスまで `below`、ガラスの上の端の札の高さ `tag` と左右の余白 `tagPadX`、0 より多い量の水位の下限 `least`
 * - `bus` は管で、一番下の槽から最初の管まで `top`、管の間 `pitch`、管の太さ `width` と中の空き `core`、弁の一辺 `valve`、
 *   左の名前の札の高さ `chip` と左右の余白 `chipPadX` と管との間 `chipGap`
 * - `flow` は流れた分で、太さ `width`、同じ管の横に重なる分を管の下へずらす 1 本ごとの間と、同じ槽の口どうしの間の上限 `track`、向きの印の一辺 `arrow`、斜線の幅 `stripe`
 * - `ring` はイベントを出した名札の外の輪の太さ、`fade` は段の中で前の出来事から次の出来事が出るまでの重なり
 */
export const PIPE_LOOK = {
  margin: 20,
  colGap: 18,
  zoneGap: 14,
  radius: 8,
  head: { h: 22, mark: 16, gap: 4, labelGap: 8 },
  status: { h: 24, padX: 10, icon: 12, gap: 6 },
  chip: { h: 22, padX: 8, gap: 8, rowGap: 6, argsGap: 6 },
  lane: { pitch: 24, room: 24, below: 20, width: 4, halo: 10, tagH: 18, tagPadX: 6, tagGap: 3, arrow: 6, port: 16, closed: "2 4", core: 0.45 },
  pill: { h: 34, padX: 10, avatar: 20, gap: 7, strip: 20, lamp: 13, lampStep: 8, lampY: 2 },
  card: { top: 14, h: 46, padX: 12, gap: 10, icon: 22, titleY: 18, valueY: 36 },
  plate: { h: 40, padX: 10, gap: 10, nameY: 15, valueY: 32, wasGap: 8 },
  tank: { w: 64, h: 96, gap: 12, inner: 5, titleY: 10, amountY: 30, wasY: 45, below: 16, tag: 18, tagPadX: 6, least: 4 },
  bus: { top: 26, pitch: 24, width: 10, core: 5, valve: 11, chip: 20, chipPadX: 8, chipGap: 10 },
  flow: { width: 4, track: 8, arrow: 5, stripe: 6 },
  ring: { width: 3 },
} as const;
