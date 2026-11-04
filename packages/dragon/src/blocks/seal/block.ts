/**
 * 封のブロック (#3239、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。段の中の `seal <列>` の行で縞の封が列の左から伸びて中身を隠し、`open <列>` の行で封が消えて中身が戻る。
 * 封は 1 列に 1 つで、封をした列だけを開けられる。封をした列の並びは開けるまで書けない (列の並びのブロックが確かめる)。
 * 列を名指す行の形 (`<語> <列>`) は選ぶブロックの `pick` の行と同じなので、読む下請け (`laneAt`) と形の誤りの文をこのブロックが持つ。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "seal",
  rank: 101,
  attach: { how: "attach-to-box", only: "lineup" },
  words: { heads: ["seal", "open"] },
};
