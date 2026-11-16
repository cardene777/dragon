/**
 * シーケンス図 (`sequence`) をパイプ図の部品で描く時の見た目の値 (Tracelyth #91、#93、#97、#107)。
 *
 * #93 で選んだ試作の案C (パイプ図の部品) に揃え、種類の行に `[shape: pipe]` を書いた時系列図の並べ方と描き方 (`layout/sequence-pipe.ts` と `render/sequence.ts`) だけが読む (#3720)。
 * 2 つは後から読む塊に入るので、パイプ図の値 (`look/pipe.ts`) と同じく、最初に読む `values.ts` の `LOOK` と `TYPE` に入れず別の file に分ける。
 */
import type { TextStyle } from "./values";

const text = (size: number, weight: number, family: TextStyle["family"] = "sans"): TextStyle => ({ size, weight, family });

/**
 * シーケンスの見た目の値。
 * `gutter` はステップの番号を置く左の列の幅、`head*` は列の頭、`mark*` は列の頭の頭文字の印、`columnGap` は列の頭どうしの間。
 * `shelfGap` は列の頭と器と札の間、`tank*` は器 (上にトークンの名前、下に数)、`tankFill` は一番多い量の時の水位、`slot*` は書き換える値の札。
 * `bar` は呼ばれた側の生存線に立てる帯の幅。
 * `pipeW` は生存線の管、`liveW` は呼ばれている間に重ねる紺の管、`callW` は呼び出しの管、`moneyW` と `liquidW` はお金の管と液の太さ。
 * `chip*` は線の上と生存線の横に置く枠付きの札、`call*` は呼び出しの管の上の札、`stubW` は生存線から横の札へ出す短い管、`markR` はリバートの×の丸、`pill*` はログの印。
 * `rowGap` は行の間、`rowPad` は今のステップの帯の上下の余白、`stepGap` はステップの帯どうしの間
 */
export const SEQ_LOOK = {
  gutter: 34,
  headH: 46,
  headMinW: 112,
  headMaxW: 160,
  headPadX: 10,
  markW: 26,
  markGap: 8,
  columnGap: 26,
  shelfGap: 10,
  tankW: 44,
  tankH: 46,
  tankGap: 8,
  tankTop: 14,
  tankBottom: 16,
  tankFill: 0.78,
  tankLeast: 0.08,
  slotLine: 11,
  slotGap: 6,
  bar: 10,
  pipeW: 9,
  liveW: 5,
  callW: 5,
  moneyW: 16,
  liquidW: 9,
  firstRow: 22,
  rowGap: 10,
  rowPad: 7,
  stepGap: 6,
  chipH: 22,
  chipPadX: 8,
  callH: 16,
  callLift: 5,
  callPad: 10,
  // 呼び出しの札がこれより広い時は、引数の区切りで次の行へ折る。電話の幅の窓にも札が収まる
  callMax: 340,
  stubW: 14,
  markR: 9,
  selfGap: 8,
  noteGap: 12,
  pillPadX: 5,
  pillGap: 6,
  // 寄って追う形の窓の高さは幅のこの倍にする。電話の縦の画面を使い、留めた列の頭と器の下に今のステップの行を収める (#86 の問い3と問い4の案A、#93)
  followAspect: 1.6,
  // 窓より広いステップを寄せる時に、最初の線の始まりの左に残す幅
  followLead: 20,
  // 明るいテーマで今のステップの帯と生存線の帯に敷く地の色 (Tracelyth #91)。明るいテーマの地 (--bg) は色を持ち、混ぜると灰色に寄るので白にする
  wash: "#ffffff",
} as const;

/**
 * 札の字。太字の所 (`**` で囲んだ所) は `SEQ_BOLD`、ログの印と器と札の名前は `SEQ_SMALL`。
 * 試作は小さい字を 9.5px で描くが、dragon の字は原寸で読めるよう 10.5px 以上にする決まり (`look/values.ts` の `TYPE`) なので、10.5px に揃える
 */
export const SEQ_FONT = text(11.5, 500);
export const SEQ_BOLD = text(11.5, 700);
export const SEQ_SMALL = text(10.5, 600);

/** 2人をキーに持つ値の矢印の段と札 (#107) */
export const SEQ_LINK = { h: 22, gap: 8, padX: 8, deltaGap: 6, side: 10, arrow: 5, lift: 10 } as const;
export const SEQ_LINK_FONT = text(11.5, 700, "mono");

/**
 * 呼び出しとログの札 (Tracelyth #97)。パイプ図の札と同じく、見出しに持ち主と名前、罫の下に引数の名前と値を左右に並べる。
 * 呼び出しの見出しは上の段に呼び先、下の段に関数の名前の 2 段、ログの見出しは「ログ」の印と持ち主とイベントの名前の 1 段
 */
export const SEQ_CARD = {
  padX: 10,
  twoHead: 40,
  oneHead: 26,
  ownerY: 15,
  nameY: 32,
  oneY: 18,
  rowH: 17,
  rowTop: 15,
  rowsPad: 8,
  valueGap: 24,
  // 札の下の縁から呼び出しの線までの間
  lift: 12,
  // 札の右の縁から次の列の管までに空ける幅
  clear: 8,
  pillH: 14,
  pillY: 7,
  pillPadX: 6,
  pillGap: 6,
  // 札がこれより広くなる時は、長い値の真ん中を「…」で縮める
  most: 340,
} as const;

/** 札の字。`O` は呼び先、`O1` はログの持ち主、`F` は関数とイベントの名前、`N` は引数の名前、`V` は引数の値、`P` はログの印 */
export const SEQC_O = text(10.5, 500, "mono");
export const SEQC_O1 = text(11.5, 500, "mono");
export const SEQC_F = text(12.5, 700, "mono");
export const SEQC_N = text(11.5, 500, "mono");
export const SEQC_V = text(11.5, 600, "mono");
export const SEQC_P = text(10.5, 700);

/**
 * 描く部品の字。`head*` は列の頭の頭文字と名前と下の字、`tank*` は器のトークンの名前と数、`slot*` は書き換える値の札の名前と値、
 * `mark` はログの印、`badge` はステップの番号。どれも 10.5px 以上にする
 */
export const SEQ_TYPE = {
  headInitial: text(13, 700, "mono"),
  headName: text(13, 700),
  headSub: text(10.5, 500),
  tankName: text(10.5, 700),
  tankValue: text(11, 700, "mono"),
  slotName: text(10.5, 600, "mono"),
  slotValue: text(11, 700, "mono"),
  mark: text(10.5, 700),
  badge: text(10.5, 700, "mono"),
} as const;
