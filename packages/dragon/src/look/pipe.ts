/**
 * 配管の図 (`pipe`、#3389) の見た目の値。見た目の元は Tracelyth の第6回の試作の「4 配管」(#3398)。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、配管の図の並べ方と描き方 (`kinds/pipe/layout.ts` と `render/pipe.ts` とブロックの描き方) だけが読む。
 * どれも後から読む塊にあるので、`values.ts` の `LOOK` と `TYPE` に入れず別の file に分ける (列の図の `look/lineup.ts` と同じ訳)。
 * 試作の寸法をそのまま使う。関係者が 6 人以上の図は、槽を細く低くした寸法 (`Small` の付く値) で並べる。
 */
import type { TextStyle } from "./values";

const text = (size: number, weight: number, family: TextStyle["family"] = "sans"): TextStyle => ({ size, weight, family });

/**
 * 配管の図の字。関係者の名前は丸の名札も箱もトークンの箱も同じ大きさで描く。
 * 量と値と比べる式は等幅、名前と題と語は和文も描ける字で描く
 */
export const PIPE_TYPE = {
  party: text(15, 600),
  initial: text(26, 700, "mono"),
  mark: text(24, 700, "mono"),
  markSmall: text(20, 700, "mono"),
  key: text(12, 500, "mono"),
  keyValue: text(13, 600, "mono"),
  tankTitle: text(13, 600),
  amount: text(28, 700, "mono"),
  sub: text(14, 500, "mono"),
  tag: text(13, 600),
  plateValue: text(28, 700, "mono"),
  calloutTag: text(12, 600),
  callout: text(20, 600),
  calloutMono: text(20, 600, "mono"),
  read: text(15, 600, "mono"),
  head: text(10.5, 700),
  chip: text(11, 700, "mono"),
  args: text(10.5, 500, "mono"),
  cardTitle: text(10.5, 600),
  cardValue: text(14, 700, "mono"),
  fold: text(12.5, 700),
} as const;

/**
 * 配管の図の置き場所と部品の大きさ。単位は図の座標。
 *
 * - `margin` は上下の余白、`edge` は左右の余白、`radius` は畳んだ箱の角、`grid` は地の点の間と点の半径
 * - `chip` はイベントの札で、高さ `h`、左右の余白 `padX`、札の間 `gap`、行の間 `rowGap`、名前と引数の間 `argsGap`、字と札の間 `labelGap`
 * - `callout` は段ごとの吹き出しで、高さ `h`、字の左右の余白 `padX`、角 `radius`、上と下の帯との間 `gap`、真ん中から上の語と下の字の基準線 `tagY` と `textY`、
 *   置き場を探す時に上下へずらす量 `near` と `far`、横へずらす量 `beside`、図の端との間 `edge`
 * - `row` は名札の行で、行の間 `pitch`、計器を載せた枝が入る行の間 `gauge`、吹き出しの帯から一番上の行の真ん中まで `top`
 * - `avatar` は丸の名札で、四角の一辺 `size`、丸の半径 `r`、光の輪の半径 `halo`、真ん中から名前の基準線まで `nameY`、頭文字の基準線 `initialY`
 * - `cabinet` は Contract の箱で、一番上の行の高さ `h` と下の行の高さ `hSmall`、名前の前と後ろの余白 `pad`・`padSmall`・`end`、頭文字の真ん中 `mark`・`markSmall`、
 *   名前の左の端 `name`・`nameSmall`、角 `radius`・`radiusSmall`、印の縮み `icon`・`iconSmall`、同じ行の名札との間 `gap`
 * - `token` はトークンの箱で、幅の下限 `w`、名前と値の名前の左右の余白 `nameW`・`keyW`、値の無い箱の高さ `h`、値 1 つごとの高さ `line`、
 *   名前の基準線 `nameY`、値の名前の基準線 `keyY`、値の名前から値の基準線まで `valueY`、角 `radius`、値の札の左右の余白 `plateX`、前の値と矢印と今の値の間 `arrowGap`
 * - `tie` は名札から槽へ下りる点線で、名札の下からの離れ `gap`、槽の上の端までの離れ `up`、囲いを持つ槽の上の端までの離れ `housing`、ほかの行の名札が避ける幅 `room`
 * - `call` は呼び出しの管で、外の管の太さ `case`、光る管の太さ `flow` (書き込めない呼び出しは半分)、処理を借りる管の芯の割合 `core`、管が名札か本管を出てから弁まで `valveAt`、
 *   横の枝の端から計器の真ん中まで `gaugeEnd`、縦の枝の端から計器の真ん中まで `gaugeDown`、弁から計器まで最も近い所 `gaugeGap`
 * - `valve` は弁で、三角の長さ `r` と幅の半分 `half`、管から取っ手の軸まで `stem`、取っ手の長さ `lever` と太さ `leverH`、軸の半径 `pivot`、取っ手を回す間 `turn`
 * - `gauge` は計器で、呼び出しの管の計器の半径 `r`、値の管の計器の半径 `rValue`、値の管から計器の真ん中まで `up`、
 *   通ったかの印の離れ `lampGap` と半径 `lamp`、針の先の空き `needle` と付け根の半径 `hub`、目盛りの帯の内側 `zone`、
 *   針の向き (確かめる前 `unseen`、通った `ok`、落ちた `fail`)、値の管の弁と箱から左へ離す量 `valveX`・`boxX`、管の上の離れ `stemGap`、式の字の離れ `readGap`
 * - `converter` は変換器の半径で、細い寸法は `rSmall`
 * - `tank` は槽で、1 つだけの槽の幅 `w1`、並ぶ槽の幅 `w2`、同じ関係者の槽の間 `inner`、囲いの内側の余白 `housing`、ガラスの高さ `h`、
 *   ガラスの内側の余白 `pad`、角 `radius` と水の角 `innerRadius`、名前の基準線 `titleY`、つや `shine`、目盛り `tick`、
 *   一番多い量の水位の割合 `fill`、0 より多い量の水位の下限 `least`、槽の下から数の基準線まで `numberY`、数の下の行まで `subY`、前の数と語の間 `tagGap`、
 *   数と字の幅の余白 `numberPad`、前の水位の線のはみ出し `markOut`
 * - `plate` は値の札で、幅の下限 `w`、字の幅の余白 `padX`、槽の上の端から札まで `top`、札の高さを槽より縮める量 `short`、名前の基準線 `nameY`、
 *   真ん中から値の基準線まで `valueY`、同じ関係者の札の間 `gap`、角 `radius`
 * - `column` は関係者の列の間で、値の管を通さない時 `gap`・`gapSmall`、値の管を通す時の下限 `segment` と、トークンの箱の幅に足す量 `segmentBox`、
 *   トークンの箱を持たない値の管の時 `segmentPlain`
 * - `band` は縦の帯の間で、一番下の行の真ん中からトークンの箱まで `tokens`、トークンの箱の下の端から一番上の本管まで `mains`、一番下の本管から槽まで `tanks`、
 *   値の管を横に通す時の一番下の行の真ん中から槽まで `side`、槽から図の下の端まで `bottom`、槽を持たない図の下の端の余白 `plain`
 * - `bus` は値の管で、外の太さ `case`、中の太さ `core`、本管の間 `pitch`、本管から槽への管の太さ `stub`、本管の端のはみ出し `end`、弁から箱へ上る軸の空き `valveUp`
 * - `side` は値の管を横に通す時で、槽の下の端から管まで `pipeY`、管からトークンの箱の下の端まで `boxUp`、箱を右へ寄せる量 `boxRight`、右の槽の手前の空き `boxLeft`
 * - `flow` は流れた分で、太さ `width`、同じ管で重なる分をずらす間 `track`、点線 `dash`、向きの印の大きさ `chevron`、斜線の幅 `stripe`
 * - `write` は書き込む管で、槽の上の端から折れる高さまで `turn`
 * - `card` は畳んだ箱で、高さ `h`、左右の余白 `padX`、札の間 `gap`、印の一辺 `icon`、題と値の基準線 `titleY` と `valueY`、名札からの離れ `top`
 * - `ring` はイベントを出した名札の外の輪の太さ
 */
export const PIPE_LOOK = {
  margin: 20,
  edge: 60,
  radius: 8,
  grid: { step: 24, dot: 1 },
  chip: { h: 22, padX: 8, gap: 8, rowGap: 6, argsGap: 6, labelGap: 8 },
  callout: { h: 64, padX: 24, radius: 16, gap: 16, tagY: -10, textY: 19, near: 80, far: 150, beside: 40, edge: 12 },
  row: { pitch: 70, gauge: 132, top: 44 },
  avatar: { size: 80, r: 32, halo: 40, nameY: 64, initialY: 10 },
  cabinet: { h: 68, hSmall: 46, pad: 64, padSmall: 54, end: 26, mark: 30, markSmall: 24, name: 52, nameSmall: 44, radius: 16, radiusSmall: 14, icon: 1.1, iconSmall: 0.9, gap: 16 },
  token: { w: 84, nameW: 36, keyW: 28, h: 38, line: 34, nameY: 25, keyY: 44, valueY: 16, radius: 11, plateX: 8, arrowGap: 6 },
  tie: { gap: 6, up: 8, housing: 26, room: 12 },
  call: { case: 12, flow: 6, core: 0.45, valveAt: 32, gaugeEnd: 61, gaugeDown: 30, gaugeGap: 28 },
  valve: { r: 15, half: 13, stem: 18, lever: 30, leverH: 8, pivot: 4, turn: 0.35 },
  gauge: { r: 22, rValue: 26, up: 62, lampGap: 14, lamp: 11, needle: 7, hub: 4, zone: 5, unseen: -118, ok: 58, fail: -64, valveX: 118, boxX: 62, stemGap: 10, readGap: 14 },
  converter: { r: 27, rSmall: 21 },
  tank: {
    w1: 120,
    w2: 104,
    w1Small: 92,
    w2Small: 84,
    inner: 64,
    innerSmall: 52,
    housing: 18,
    h: 200,
    hSmall: 170,
    pad: 6,
    radius: 18,
    innerRadius: 13,
    titleY: 30,
    shine: { x: 12, y: 16, w: 7, short: 40 },
    tick: { from: 16, to: 7, count: 6 },
    fill: 0.8,
    least: 4,
    numberY: 44,
    subY: 26,
    tagGap: 10,
    numberPad: 24,
    markOut: 8,
  },
  plate: { w: 130, padX: 36, top: 40, short: 80, nameY: 28, valueY: 22, gap: 24, radius: 16 },
  column: { gap: 90, gapSmall: 56, segment: 250, segmentBox: 154, segmentPlain: 160 },
  band: { tokens: 78, mains: 54, tanks: 52, side: 128, bottom: 116, plain: 40 },
  bus: { case: 24, core: 16, pitch: 26, stub: 6, end: 10, valveUp: 14 },
  side: { pipeY: 22, boxUp: 58, boxRight: 40, boxLeft: 44 },
  flow: { width: 4, track: 8, dash: "2 9", chevron: 7, stripe: 9 },
  write: { turn: 28 },
  card: { top: 16, h: 46, padX: 12, gap: 10, icon: 22, titleY: 18, valueY: 36 },
  ring: { width: 3 },
} as const;
