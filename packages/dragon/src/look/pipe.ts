/**
 * 配管の図 (`pipe`、#3389) の見た目の値。見た目の元は Tracelyth の第6回の試作の「4 配管」(#3398)。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、配管の図の並べ方と描き方 (`kinds/pipe/layout.ts` と `render/pipe.ts` とブロックの描き方) だけが読む。
 * どれも後から読む塊にあるので、`values.ts` の `LOOK` と `TYPE` に入れず別の file に分ける (列の図の `look/lineup.ts` と同じ訳)。
 * 部品の寸法は試作の `swap` を全ての図の正にし、込み合う図でも小さくせず、間を広げて図を大きくする (#3418)。
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
  mark: text(22, 700, "mono"),
  key: text(12, 500, "mono"),
  keyValue: text(13, 600, "mono"),
  tankTitle: text(13, 600),
  amount: text(22, 700, "mono"),
  sub: text(14, 500, "mono"),
  delta: text(13, 700, "mono"),
  tag: text(12, 600),
  plateValue: text(24, 700, "mono"),
  label: text(12, 700, "mono"),
  io: text(11, 700),
  head: text(10.5, 700),
  chip: text(11, 700, "mono"),
  args: text(10.5, 500, "mono"),
  cardTitle: text(10.5, 600),
  cardValue: text(14, 700, "mono"),
  fold: text(12.5, 700),
} as const;

/**
 * 配管の図の置き場所と部品の大きさ。単位は図の座標。部品の大きさは込み合う図でも変えず、間を広げて図を大きくする (#3418)。
 *
 * - `margin` は上下の余白、`edge` は左右の余白、`radius` は畳んだ箱の角、`grid` は地の点の間と点の半径
 * - `chip` は図の中の札 (流れた量、イベント、戻り値、計器の式、入力と出力の印) で、高さ `h`、左右の余白 `padX`、札の間 `gap`、名前と引数の間 `argsGap`、
 *   角 `rx` (札は丸めず角にする)、管から札までの離れ `off`、イベントの札と出した箱の間 `beside`、流れた量の札を管に沿ってずらす刻み `slide`
 * - `row` は名札の行で、行の間 `pitch`、上の余白から一番上の行の真ん中まで `top`
 * - `avatar` は丸の名札で、四角の一辺 `size`、丸の半径 `r`、光の輪の半径 `halo`、真ん中から名前の基準線まで `nameY`、頭文字の基準線 `initialY`
 * - `cabinet` は Contract の箱で、高さ `h`、名前の前と後ろの余白 `pad`・`end`、頭文字の真ん中 `mark`、名前の左の端 `name`、角 `radius`、印の縮み `icon`、
 *   同じ行の名札との間 `gap`。どの行の箱も同じ寸法で描き、幅は名前の長さに合わせる。
 *   高さは、真ん中と上と下の 3 つの高さから出る呼び出しの管が、どれも縁の角の丸みから離れる高さ (#3523)
 * - `token` はトークンの箱で、幅の下限 `w`、名前と値の名前の左右の余白 `nameW`・`keyW`、値の無い箱の高さ `h`、値 1 つごとの高さ `line`、
 *   名前の基準線 `nameY`、値の名前の基準線 `keyY`、値の名前から値の基準線まで `valueY`、角 `radius`、値の札の左右の余白 `plateX`、前の値と矢印と今の値の間 `arrowGap`、
 *   値の管から箱の下の端まで `up`
 * - `tie` は名札から自分の囲いへ下りる点線で、名札の下からの離れ `gap`
 * - `call` は呼び出しの管で、外の管の太さ `case`、光る管の太さ `flow` (書き込めない呼び出しは半分)、処理を借りる管の芯の割合 `core`、
 *   名札を出てから弁の真ん中まで `valveAt`、管の上の弁と計器の場所の空き `room`
 * - `valve` は弁で、三角の長さ `r` と幅の半分 `half`、管から取っ手の軸まで `stem`、取っ手の長さ `lever` と太さ `leverH`、軸の半径 `pivot`、取っ手を回す間 `turn`
 * - `gauge` は計器で、半径 `r` (呼び出しの管も値の管も同じ)、値の管から計器の真ん中まで `up`、通ったかの印の離れ `lampGap` と半径 `lamp`、
 *   針の先の空き `needle` と付け根の半径 `hub`、目盛りの帯の内側 `zone`、針の向き (確かめる前 `unseen`、通った `ok`、落ちた `fail`)、管の上の離れ `stemGap`
 * - `converter` は変換器の半径
 * - `tank` は槽で、幅 `w`、同じ持ち主の槽の間 `inner`、ガラスの高さ `h`、ガラスの内側の余白 `pad`、角 `radius` と水の角 `innerRadius`、名前の基準線 `titleY` と字の間 (字の大きさに対する割合) `titleTrack`、
 *   つや `shine`、目盛り `tick`、一番多い量の水位の割合 `fill`、0 より多い量の水位の下限 `least`、槽の下から残高の基準線まで `numberY`、
 *   残高から増減の基準線まで `deltaY`、増減から暫定か確定の語の基準線まで `tagY`、字の幅の余白 `numberPad`、前の水位の線のはみ出し `markOut`、
 *   値の管の口を置く高さの候補 (ガラスの上の端から) `ports`
 * - `plate` は値の札で、幅の下限 `w`、字の幅の余白 `padX`、槽の上の端から札まで `top`、札の高さを槽より縮める量 `short`、名前の基準線 `nameY`、
 *   真ん中から値の基準線まで `valueY`、同じ持ち主の札の間 `gap`、角 `radius`
 * - `housing` は持ち主ごとの槽の囲いで、左右と下の内側の余白 `pad`、上の内側の余白 (入力と出力の印を置く) `top`、槽の下の字の帯の高さ `text`、囲いどうしの間の下限 `gap`
 * - `band` は囲いの段で、名札の下の端から囲いまで `tag`、段の下の端から次の段の名札まで `next`、下の段の名札の高さの帯 `tags`
 * - `lane` は管を通す道で、平行な管の真ん中どうしの間 `pitch`、管と部品の間 `clear`、図の外側の道の数 `outer`
 * - `bus` は値の管で、外の太さ `case`、中の太さ `core`、変換器と槽を結ぶ管の太さ `stub`、弁から箱へ上る軸の空き `valveUp`
 * - `flow` は流れた分で、太さ `width`、同じ管で重なる分をずらす間 `track`、点線 `dash`、向きの印の大きさ `chevron`、斜線の幅 `stripe`、
 *   流れた段に管を通る斜線の液の塊の長さ `slug` (管の長さに対する割合。試作の4配管と同じ 0.34)
 * - `write` は書き込む管で、札の上の端から折れる高さまで `turn`
 * - `card` は畳んだ箱で、高さ `h`、左右の余白 `padX`、札の間 `gap`、印の一辺 `icon`、題と値の基準線 `titleY` と `valueY`、名札からの離れ `top`
 * - `ring` はイベントを出した名札の外の輪の太さ
 * - `dim` はその段で動かなかった部品の濃さ
 * - `narrow` は狭い枠 (`frame` より狭い枠) の見せ方で、画面で見える字の大きさの下限 `px` と、図の下の大きな札の帯の上の空き `gap`
 */
export const PIPE_LOOK = {
  margin: 20,
  edge: 60,
  radius: 8,
  grid: { step: 24, dot: 1 },
  chip: { h: 22, padX: 8, gap: 8, argsGap: 6, rx: 4, off: 10, beside: 12, slide: 4 },
  row: { pitch: 84, top: 48 },
  avatar: { size: 80, r: 32, halo: 40, nameY: 64, initialY: 10 },
  cabinet: { h: 80, pad: 52, end: 22, mark: 26, name: 46, radius: 12, icon: 1, gap: 16 },
  token: { w: 84, nameW: 36, keyW: 28, h: 38, line: 34, nameY: 25, keyY: 44, valueY: 16, radius: 6, plateX: 8, arrowGap: 6, up: 58 },
  tie: { gap: 6 },
  call: { case: 12, flow: 6, core: 0.45, valveAt: 30, room: 16 },
  valve: { r: 15, half: 13, stem: 18, lever: 30, leverH: 8, pivot: 4, turn: 0.35 },
  gauge: { r: 24, up: 62, lampGap: 12, lamp: 10, needle: 7, hub: 4, zone: 5, unseen: -118, ok: 58, fail: -64, stemGap: 10 },
  converter: { r: 24 },
  tank: {
    w: 112,
    inner: 64,
    h: 200,
    pad: 6,
    radius: 18,
    innerRadius: 13,
    titleY: 30,
    titleTrack: 0.1,
    shine: { x: 12, y: 16, w: 7, short: 40 },
    tick: { from: 16, to: 7, count: 6 },
    fill: 0.8,
    least: 4,
    numberY: 30,
    deltaY: 24,
    tagY: 21,
    numberPad: 16,
    markOut: 8,
    // 口の間は、管の太さ (24) と管どうしの間 (10) より広くする。隣の口から並んで出る管が通れるように。
    // 箱を載せる管の口 (先頭) を真ん中に置き、上と下に 2 つずつ口を残す。上へ抜ける管と下へ抜ける管が 2 本ずつ入れ子にできる
    ports: [114, 150, 78, 186, 42],
  },
  plate: { w: 130, padX: 36, top: 40, short: 80, nameY: 28, valueY: 22, gap: 24, radius: 6 },
  housing: { pad: 18, top: 34, text: 84, gap: 72 },
  band: { tag: 18, next: 30, tags: 76 },
  lane: { pitch: 38, clear: 12, outer: 6 },
  bus: { case: 24, core: 16, stub: 6, valveUp: 14 },
  flow: { width: 4, track: 8, dash: "2 9", chevron: 7, stripe: 9, slug: 0.34 },
  write: { turn: 24 },
  card: { top: 16, h: 46, padX: 12, gap: 10, icon: 22, titleY: 18, valueY: 36 },
  ring: { width: 3 },
  dim: 0.35,
  narrow: { frame: 600, px: 10.5, gap: 28 },
} as const;
