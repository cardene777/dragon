/**
 * 考えのブロック (#3619)。
 *
 * 考えを広げる地図の部品 (`only: mind`)。段の中の `idea <名札> as <名前> of <親> [color: <色>]` の行で、その段に考えを 1 つ出し、
 * 親から考えへの枝の線を引く。`of <親>` の無い考えは真ん中の題で、1 つの図にちょうど 1 つ置く。
 * 親は前に書いた考えに限り、題、枝、葉の 3 段 (`MIND_LEVELS`) まで書ける。`as <名前>` を省くと名札がそのまま名前になる。
 * 名前は最後の `of <親>` の前までで、語の `of` を含む名前は `"` で囲む。
 * 決まりは読み方 (`read.ts`) の読む処理 (無い親、2 つ目の題、深すぎる考え) と `finish` (題が無い図) が持つ。
 */
import type { Color } from "../color/block";
import type { Block } from "../block";

/** 親を指す語 */
export const OF = "of";

/** 考えを広げる地図に書ける段の数。真ん中の題、枝、葉 */
export const MIND_LEVELS = 3;

/** 考えを広げる地図の考え。書いた段で現れ、親 (`parent`) から考えへの枝の線が引かれる。親の無い考えが真ん中の題 */
export interface MindIdea {
  type: "idea";
  id: string;
  name: string;
  parent?: string;
  color?: Color;
}

export const block: Block = {
  name: "idea",
  rank: 146,
  attach: { how: "place", only: "mind" },
  words: { heads: ["idea"], attrs: { idea: ["color"] } },
  // 真ん中の題がちょうど 1 つの決まりを持つ
  always: true,
};
