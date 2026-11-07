/**
 * 試す図 (`try`、#3337) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと色をここと `values.ts` から読む。
 * 試す図の配置と描画 (`layout/try.ts` と `render/try.ts`) は後から読む塊にあるので、列の図と同じく `values.ts` の `LOOK` に入れない。
 * 待ち行列に縦に収まるチップの数 (`queueMost`) は記法を読む所も使う (満杯の待ち行列へ送る行を断る) ので、この file は描く部品を読まない。
 * 見た目の元は承認した板 (網を上に、待ち行列と、prev と hash を `=` でつないだ機械の列を下に置く形)。
 */
import type { ColorKey } from "./values";

/**
 * 図の幅の下限 `width`、外周の余白 `margin`、部品どうしの間 `gap`。部品は書いた順に上から積む。
 * `head` は部品の題で、部品の上端から題の基準線まで `titleY`、中身の上端まで `body`。
 * `route` は網で、節の丸の半径 `r`、同じ列の節どうしの間 `pitch`、両端の列を図の左右から離す `padX`、丸の真ん中から名札の基準線まで `labelY`、
 * 名札の下の余白 `bottom`、丸の中の絵柄の縮み `glyph`、部品を横に並べた時 (#3429) に隣の列の名札どうしを離す間で、これより近い名札を上へ逃がす (#3478) 間 `labelGap`、
 * 関門で止まった節 (#3476) に描く輪を節の丸の縁から離す間 `stop`、隣の名札とぶつかる名札を節の上へ逃がす時 (#3478) の丸の真ん中から名札の基準線まで `labelUp` と、
 * 上へ逃がした名札が題の行とぶつからないよう網の節を下げる名札 1 行ぶんの高さ `upRow`。
 * `queue` は待ち行列で、チップを積む所の高さ `h` (縦に収まる数はここから導く)、枠の内側の余白 `padX` と `padY`、チップの列と字の間 `hintGap`。
 * `chip` はチップで、高さ `h`、チップどうしの縦の間 `gap`、字の左右の余白 `padX`、名前と値の間 `valueGap`、幅の下限 `minW`、角の丸み `radius`。
 * `block` はブロックで、幅の下限 `w`、隣のブロックとの間 `gap` (つながりの線と印を置く)、内側の左右の余白 `padX`、上の余白 `padTop`、
 * 番号の行の高さ `noH`、行どうしの間 `rowGap`、prev と hash の行の高さ `row`、SHA-256 の字の行の高さ `sha`、下の余白 `padBottom`、
 * 角の丸み `radius`、prev と hash の行の角の丸み `rowRadius`、行の中の字の左の余白 `rowPad`、札と値の間 `keyGap`、
 * 縦に組んだ形 (#3366) でつながりの線を回すブロックの右の端からの長さ `side` (つながりの印の真ん中がここに来る)。
 * `link` はつながりの印の一辺 `badge`。`fold` は畳んだ印の高さ `h` と字の左右の余白 `padX`。`shown` は出すブロックと記録の数。
 * `record` は記録の列 (#3441) の記録で、幅の下限 `w`、隣の記録との間 `gap`、番号と印の札の間 `headGap`、印の札の字の左右の余白 `markPadX`。
 * 記録の高さと内側の余白と行の間は、ブロックの値 (`block`) とチップの値 (`chip`) を使い、印の札の高さは畳んだ印の高さ (`fold.h`) を使う。
 * `color` は部品の色 `part`、切れたつながりの色 `broken` (橙)、網の中の節の色 `node`、関門で止まった節と記録の色 `stop` (#3476)
 */
export const TRY_LOOK = {
  width: 736,
  margin: 24,
  gap: 30,
  head: { titleY: 12, body: 24 },
  route: { r: 17, pitch: 62, padX: 46, labelY: 31, bottom: 6, glyph: 0.62, labelGap: 16, stop: 5, labelUp: 25, upRow: 18 },
  queue: { h: 196, padX: 14, padY: 14, hintGap: 22 },
  chip: { h: 26, gap: 8, padX: 10, valueGap: 8, minW: 72, radius: 4 },
  block: {
    w: 196,
    gap: 52,
    padX: 14,
    padTop: 12,
    noH: 16,
    rowGap: 10,
    row: 28,
    sha: 18,
    padBottom: 14,
    radius: 8,
    rowRadius: 4,
    rowPad: 8,
    keyGap: 8,
    side: 42,
  },
  record: { w: 160, gap: 18, headGap: 12, markPadX: 8 },
  link: { badge: 20 },
  fold: { h: 22, padX: 8 },
  shown: 3,
  color: { part: "green", broken: "amber", node: "slate", stop: "rose" } satisfies Record<string, ColorKey>,
} as const;

/** 待ち行列に縦に収まるチップの数の下限と上限。上限は 1 列に並べられるチップの数 (`LANE_MOST`) と同じ */
const MOST_RANGE = [4, 12] as const;

/** 待ち行列の箱に縦に収まるチップの数。チップを積む所の高さ (`TRY_LOOK.queue.h`) にチップの高さと間で何枚入るかを、4 以上 12 以下に収める */
export function queueMost(): number {
  const { h, gap } = TRY_LOOK.chip;
  const fit = Math.floor((TRY_LOOK.queue.h + gap) / (h + gap));
  return Math.min(MOST_RANGE[1], Math.max(MOST_RANGE[0], fit));
}
