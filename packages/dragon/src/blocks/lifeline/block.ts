/**
 * 生存線のブロック (#3345)。
 *
 * 時系列図の部品 (`only: sequence`)。箱ごとに下へ縦の線が伸び、上から下へ時が進む。線は生存線の間を走る。
 * 生存線は宣言した箱の並びのまま左から右へ立つので、記法に生存線の行は無く、原本 (版2) にも生存線の欄は無い (#3346)。
 * 描く処理の形 (版1と同じ欄) へ組み直す時に、箱の並びから `sequence` の欄を組む (`model.ts` の `toModel`)。
 */
import type { Box } from "../../schema";
import { type Block, none } from "../block";

/** 時系列図の原本の `sequence` の欄。生存線を宣言した箱の並びのまま左から並べる */
export const lifelinesOf = (boxes: readonly Box[]): { lifelines: string[] } => ({ lifelines: boxes.map((box) => box.id) });

export const block: Block = {
  name: "lifeline",
  rank: 25,
  attach: { how: "attach-to-box", only: "sequence" },
  words: {},
  shape: none("版2の原本は生存線の欄を持たない。描く処理の形へ組み直す時に、箱の並びから組む (model.ts の toModel)"),
  read: none("生存線の行は無い。描く処理の形へ組み直す時に、toModel が lifelinesOf で箱の並びから組む"),
  print: none("生存線の並びは箱の並びと同じなので書かない。読み直す時に箱の宣言から組み直す"),
  messages: none("生存線は記法に行を持たないので、誤りの文を持たない"),
};
