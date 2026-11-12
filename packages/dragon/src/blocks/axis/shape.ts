/**
 * axis のブロックの原本の形の欠片 (#3622)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 2つの軸で置く図の根の `matrix` の欄の形 (軸と課題) を持つ。課題の 1 つの形は課題のブロック (`matrix-item`) の欠片が持つ。
 */
import type { BlockShape } from "../block";
import { MATRIX_AXES } from "./limits";

export const shape: BlockShape = {
  definitions: {
    matrix: {
      type: "object",
      additionalProperties: false,
      required: ["axes", "items"],
      properties: {
        axes: {
          description: "横の軸と縦の軸の順の 2 つの軸",
          type: "array",
          minItems: MATRIX_AXES,
          maxItems: MATRIX_AXES,
          items: { $ref: "#/definitions/matrixAxis" },
        },
        items: {
          description: "課題。書いた順に置く前の一覧へ上から並べ、段の中の line の出来事で区画へ置く",
          type: "array",
          items: { $ref: "#/definitions/matrixItem" },
        },
      },
    },
    matrixAxis: {
      description: "2つの軸で置く図の軸。from は軸の始まりの小さい側の字、to は矢印の先の大きい側の字",
      type: "object",
      additionalProperties: false,
      required: ["name"],
      properties: {
        name: { $ref: "#/definitions/text" },
        from: { $ref: "#/definitions/text" },
        to: { $ref: "#/definitions/text" },
      },
    },
  },
};
