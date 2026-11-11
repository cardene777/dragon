/**
 * matrix-item のブロックの原本の形の欠片 (#3622)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 区画へ置く出来事は列の図と同じ `line` の出来事なので、出来事の形は列の並びのブロックの欠片が持ち、ここは課題の 1 つの形だけを持つ。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  definitions: {
    matrixItem: {
      description: "2つの軸で置く図の課題。name は札に書く名前",
      type: "object",
      additionalProperties: false,
      required: ["id", "name"],
      properties: {
        id: { $ref: "#/definitions/id" },
        name: { $ref: "#/definitions/text" },
      },
    },
  },
};
