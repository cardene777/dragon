/**
 * 生存線のブロック (#3345)。
 *
 * 時系列図の部品 (`only: sequence`)。箱ごとに下へ縦の線が伸び、上から下へ時が進む。線は生存線の間を走る。
 * 生存線は宣言した箱の並びのまま左から右へ立つので、記法に生存線の行は無く、原本 (版2) にも生存線の欄は無い (#3346)。
 * 描く処理の形 (版1と同じ欄) へ組み直す時に、箱の並びから `sequence` の欄を組む (`model.ts` の `toModel`)。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "lifeline",
  rank: 25,
  attach: { how: "attach-to-box", only: "sequence" },
  words: {},
};
