/**
 * 選ぶブロック (#3239、#3348)。
 *
 * 列の図の部品 (`only: lineup`)。段の中の `pick <列>` の行で、その列の縁に色が付いて頭に印が出て、ほかの列が薄くなる。
 * 薄くなった列は、後の段で並びを書き換えるか選ぶと濃く戻る。置き場 (順番の無い箱) は薄くしない。
 * 列を名指す行の形と誤りの文は、封のブロックと共に使う (`laneAt`)。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "pick",
  rank: 102,
  attach: { how: "attach-to-box", only: "lineup" },
  words: { heads: ["pick"] },
};
