/**
 * 輪のブロック (#3623)。
 *
 * 回り続ける図の部品 (`only: cycle`)。行の頭の語を持たず、回り続ける図の決まりだけを持つ。
 * `box` の行で宣言した手順は、書いた順に真上から右回りに輪の上へ置き、手順は 2 つから 8 つまで書ける。
 * 段の中の線は輪の次の手順への線だけを受け、最後の手順から最初の手順への線も次の手順への線になる。
 * 1 つ飛ばす線、逆回りの線、同じ手順へ戻る線と、名前を持つ線は誤りで止める。走る札は線の `[tag: <字>]` で書く。
 * `act` と `group` の行は書けない。決まりは読み方 (`read.ts`) の `checkHead` と `afterEdge` と `finish` が持つ。
 * 原本の欄は持たず、手順の数の決まりは骨組み (`schemas/base.schema.json`) が持つ。
 */
import type { Block } from "../block";

/** 輪に置ける手順の数 */
export const RING_STEPS = { least: 2, most: 8 } as const;

export const block: Block = {
  name: "ring",
  rank: 145,
  attach: { how: "connect", only: "cycle" },
  words: {},
  // 回り続ける図の手順の数と、輪の次の手順への線だけを受ける決まりを持つ
  always: true,
};
