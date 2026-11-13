/**
 * matrix-item のブロックの原本の形の欠片 (#3622)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 区画へ置く出来事は列の図と同じ `line` の出来事なので、出来事の形は列の並びのブロックの欠片が持ち、ここは課題の 1 つの形だけを持つ。
 */
import type { BlockShape } from "../block";
import { SCORE_MAX } from "./spot";

export const shape: BlockShape = {
  definitions: {
    matrixItem: {
      description: "2つの軸で置く図の課題。name は札に書く名前。x と y は横と縦の軸の 0 から 10 の点数で、2 つを揃えて書く (#3637)",
      type: "object",
      additionalProperties: false,
      required: ["id", "name"],
      properties: {
        id: { $ref: "#/definitions/id" },
        name: { $ref: "#/definitions/text" },
        x: { type: "number", minimum: 0, maximum: SCORE_MAX },
        y: { type: "number", minimum: 0, maximum: SCORE_MAX },
      },
      // 片方の点数だけを書いた課題は、もう片方の欄を名指して断る
      allOf: [
        { if: { required: ["x"] }, then: { required: ["y"] } },
        { if: { required: ["y"] }, then: { required: ["x"] } },
      ],
    },
  },
};
