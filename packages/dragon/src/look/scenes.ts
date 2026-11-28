/**
 * 場面を選ぶ見た目の選べる図 (`try` の `[shape: scenes]`、#3873) の見た目の値。
 *
 * 広い幅は時系列図と同じ部品 (箱、点線の生存線、送り手の色の矢印、番号の丸) で描くので、箱と線と丸と札の寸法は値の表 (`values.ts` の `LOOK`) を読み、
 * ここには場面の図だけが持つ並べ方の寸法と字と動きの長さを置く。狭い幅は物の名前の札と、やり取りを 1 つずつ縦に積む札で描く。
 * 選べる図の並べ方と描き方と再生の部品は選べる図の塊 (`kinds/try.ts`) に入り、軽い入口が最初に読む量に入れないので、この表もその塊だけが読む。
 * 置き方を替える幅と動きの長さは bitsumi の型の試作 (cardene777/bitsumi. の #878 の `scenes-look.json`) の値を写した
 */
import { text } from "./values";

/**
 * `narrowBelow` は図の枠の幅で、これより狭い枠では狭い幅の置き方 (物の札とやり取りの札を縦に積む) で描く。`margin` は図の外周の余白。
 * `past` は済んだやり取りの矢印の濃さで、時系列図の済んだ線と同じ値。
 * `wide` は広い幅の置き方。`col` は物 1 つの列の幅の下限、`least` は図の幅の下限、`boxGap` は箱と隣の列の間に空ける幅の下限、
 * `first` は箱の下端から最初のやり取りの上端まで、`rowGap` はやり取りの間、`lineGap` は矢印の名前の札の下端から矢印まで、
 * `line` は名前の札の行の高さ、`padX` と `padY` は札の字の周りの余白、`span` は矢印の両端から名前を折る幅を内へ寄せる長さ、
 * `noteGap` は注記の札と番号の丸の間、`tail` は最後のやり取りの下に伸ばす生存線の長さ、`bare` はやり取りの無い場面の生存線の長さ、
 * `answerGap` は生存線の下端から答えまで (書き出しの止め絵だけ)、`whyGap` は答えの一文と理由の間。
 * `tall` は狭い幅の置き方。`pill` は物の札で、高さ `h`、字の左右の余白 `padX`、札の間 `gap`、色の点の半径 `dot` と点と字の間 `dotGap`。
 * `strip` は物の札の下端から最初のやり取りの札まで。`card` はやり取りの札で、内側の余白 `padX` と `padY`、札の間 `gap`、
 * 中身の行の高さ `name`、送り手と受け手の行の高さ `route`、番号の丸と字の間 `badgeGap`、角の丸み `radius`。`answerGap` は最後の札の下端から答えまで
 */
export const SCENES_LOOK = {
  narrowBelow: 560,
  margin: 16,
  past: 0.45,
  wide: {
    col: 168,
    least: 640,
    boxGap: 24,
    first: 26,
    rowGap: 16,
    lineGap: 10,
    line: 15,
    padX: 9,
    padY: 3,
    span: 12,
    noteGap: 6,
    tail: 22,
    bare: 64,
    answerGap: 22,
    whyGap: 6,
  },
  tall: {
    pill: { h: 28, padX: 12, gap: 6, dot: 4, dotGap: 6 },
    strip: 14,
    card: { padX: 14, padY: 11, gap: 8, name: 20, route: 18, badgeGap: 10, radius: 10 },
    answerGap: 18,
  },
} as const;

/** 場面の図の字。物の札、やり取りの札の中身と送り手と受け手、答えの一文と理由。どれも読める大きさ (10.5) 以上にする */
export const SCENES_TYPE = {
  pill: text(12.5, 700),
  card: text(14, 700),
  route: text(12.5, 600),
  answerHead: text(15, 700),
  answerWhy: text(13.5, 500),
} as const;

/**
 * 送った場面のやり取りを引く動きの長さ (ミリ秒)。矢印は名前の札を `label` で出しながら番号の丸を `pop` で弾ませ、線を `draw` で伸ばして矢じりを `pop` で出す。
 * 注記は札を `note` で広げ、狭い幅の札は `card` で上から下ろす。やり取りの間は `stagger`、最後のやり取りの後に答えを `answer` で出す
 */
export const SCENES_TIME = {
  draw: 900,
  note: 800,
  label: 400,
  pop: 300,
  stagger: 160,
  card: 900,
  answer: 400,
} as const;
