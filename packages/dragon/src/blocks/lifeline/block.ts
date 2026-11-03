/**
 * 生存線のブロック (#3345)。
 *
 * 時系列図の部品 (`only: sequence`)。箱ごとに下へ縦の線が伸び、上から下へ時が進む。線は生存線の間を走る。
 * 生存線は宣言した箱の並びのまま左から右へ立つので、記法に生存線の行は無く、読む時に箱の並びから原本の `sequence` の欄を組む (`lifelinesOf`)。
 * 書き戻す時は箱の宣言だけを書き、生存線の並びは読み直す時に箱の並びから組み直す。
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
  shape: {
    definitions: {
      sequence: {
        description: "時系列図の種類の欄。生存線を左から並べる順",
        type: "object",
        additionalProperties: false,
        required: ["lifelines"],
        properties: { lifelines: { type: "array", minItems: 1, items: { $ref: "#/definitions/id" } } },
      },
    },
  },
  read: none("生存線の行は無い。時系列図を読み終えた時に parser が lifelinesOf で箱の並びから組む"),
  print: none("生存線の並びは箱の並びと同じなので書かない。読み直す時に箱の宣言から組み直す"),
  messages: none("生存線は記法に行を持たないので、誤りの文を持たない"),
};
