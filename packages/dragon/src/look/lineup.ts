/**
 * 列の図 (`lineup`、#3239) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと色をここと `values.ts` から読む。
 * 列の図の配置と描画 (`kinds/lineup/layout.ts` と `render/lineup.ts` と列の図のブロックの描き方) だけが読み、どちらも後から読む塊にある (#3248)。
 * `values.ts` の `LOOK` に入れると、列の図を描かない頁も最初に読む script にこの値を持つので、別の file に分ける (#3351)。
 */
/**
 * 列の図の卓の形 (#3351)。見本は `docs/design/lineup/auction.pen` の 2 枚の板 (横に並べた形と、携帯の幅で縦に組んだ形)。
 * 横に並べた図の外周の余白は `margin`。箱は左右の余白 `padX`、角の丸み `radius`、隣の箱との間 `gap`、間に矢印を挟む時の間 `arrowGap`。
 * 箱の上端から、名前の基準線まで `titleY`、名前の下の字の基準線まで `hintY`、チップを置く所の上端まで `trackY`。
 * 名前の下の字の左の矢印は幅 `hintArrow` で、字まで `hintGap` 空ける。選ばなかった札の濃さは `faint`、置き場の枠の点線は `dash`、札の下の端の字の色は `noteColor`。
 * `card` は札で、幅の下限 `w`、チップを置く所から仕切りまで `foot`、仕切りから note の数の基準線まで `noteY`、基準線から下の端まで `bottom`、数と単位の間 `unitGap`。
 * `pool` は横に並べた置き場で、幅の下限 `w`、チップの間の下限 `gapX` と `gapY`、チップの下の余白 `bottom`。チップはずらさず格子に並べる (#3408)。
 * `band` は縦に組んだ置き場の帯で、名前の右に字を置く間 `hintGap`、チップを置く所の上端 `trackY`。チップの間は横に並べた置き場と同じ下限で数え、帯の幅を等しく割った格子に並べる。
 * `chip` はチップの高さ `h`、札の中の上下の間 `gap`、角の丸み `radius`、字の左右の余白 `padX`、置き場のチップの幅の下限 `minW`、光の太さ `glow`。
 * `seal` は封で、チップを置く所の外へ `over` 広げ、角の丸み `radius`、縞の幅 `stripe`。真ん中の錠の箱は一辺 `lock` で、錠は箱の真ん中から `lockY`、字の基準線は `wordY` 下げる。
 * `lock` は錠の形で、胴の幅 `w` と高さ `h`、弦の半径 `r` と高さ `rise`。
 * `stamp` は札に押す印で、高さ `h`、字の左右の余白 `padX`、角の丸み `radius`、傾き `tilt`、色 `color`、札の右の端から `inset`、札の下の端から `drop` 下げる。
 * `mark` は選んだ札の印で、高さ `h`、字の左右の余白 `padX`、名前の右の間 `gap`、名前の行に入らない時に札の上の端から持ち上げる `lift`、色 `color`。
 * `role` は役の札で、幅の下限 `w`、高さ `h` (縦に組んだ時は `stackH`)、札どうしの間 `gap`、字の左の余白 `padX`、名前と一言の基準線 `titleY` と `noteY`、光る色 `color`、役の札と箱の間 `below`。
 * `headline` は図の上の題で、図の題の基準線 `titleY`、段の題の基準線 `headY`、段の題の行の送り `headLine`、段の題から文の基準線まで `sayY`、文の行の送り `sayLine`、文の下から役の札まで `below`、右上の段の番号の上下の位置 `badgeY`。
 * `remark` は札の下の一言で、札の下の端から `top`、行の送り `line`、色の棒の幅 `bar` と高さ `barH`、棒と字の間 `gap`。
 * `ahead` は「この先」の帯で、上の物から `top`、札の高さ `h`、行の間 `gap`、札の間の矢印の幅 `arrow`、番号の箱の一辺 `no`、札の内側の余白 `padX`、番号の箱と題の間 `textGap`、「この先」の字の右の間 `labelGap`。
 * `legend` は凡例で、上の物から `top`、見本の一辺 `swatch`、見本と説明の間 `gap`、行の中の間 `colGap`、行の送り `line`。
 * `arrow` は箱の間の矢印で、箱から `inset` 離し、矢じりの長さ `head`。
 * `stack` は縦に組んだ形で、図の幅の下限 `width`、外周の余白 `margin`、帯と札の列の間に矢印を挟む時の間 `arrowGap`
 */
export const LINEUP_LOOK = {
  margin: 20,
  padX: 10,
  radius: 6,
  gap: 12,
  arrowGap: 26,
  titleY: 24,
  hintY: 41,
  trackY: 54,
  hintArrow: 7,
  hintGap: 5,
  faint: 0.35,
  dash: [4, 3],
  noteColor: "green",
  card: { w: 140, foot: 11, noteY: 31, bottom: 14, unitGap: 5 },
  pool: {
    w: 112,
    gapX: 10,
    gapY: 10,
    bottom: 14,
  },
  band: { hintGap: 12, trackY: 40 },
  chip: { h: 22, gap: 4, radius: 3, padX: 8, minW: 24, glow: 5 },
  seal: { over: 3, radius: 4, stripe: 7, lock: 44, lockY: -7, wordY: 13 },
  lock: { w: 14, h: 10, r: 4.5, rise: 3 },
  stamp: { h: 22, padX: 8, radius: 4, tilt: -4, color: "rose", inset: 6, drop: 6 },
  mark: { h: 18, padX: 5, gap: 8, lift: 10, color: "violet" },
  role: { w: 200, h: 50, stackH: 46, gap: 24, padX: 14, titleY: 21, noteY: 38, color: "green", below: 22 },
  headline: { titleY: 11, headY: 37, headLine: 26, sayY: 22, sayLine: 19, below: 18, badgeY: 7 },
  remark: { top: 14, line: 21, bar: 3, barH: 14, gap: 8 },
  ahead: { top: 22, h: 24, gap: 8, arrow: 20, no: 16, padX: 4, textGap: 8, labelGap: 12 },
  legend: { top: 22, swatch: 12, gap: 8, colGap: 24, line: 22 },
  arrow: { inset: 4, head: 5 },
  stack: { width: 372, margin: 12, arrowGap: 38 },
} as const;
