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
      // 表 (#3637) は点数で点を打つ見た目だけが持つ。見た目の値は scatter だけなので、見た目を書かない図で表の欄を断る
      if: { not: { required: ["shape"] } },
      then: { properties: { table: { $ref: "#/definitions/absent" } } },
      properties: {
        shape: { description: "見た目。scatter は課題を点数どおりの点で打つ (#3637)。書かない図は札を区画へ置く", enum: ["scatter"] },
        table: { description: "none は点数で点を打つ見た目の置く前の課題の表を出さない", enum: ["none"] },
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
      description: "2つの軸で置く図の軸。from は軸の始まりの小さい側の字、to は矢印の先の大きい側の字。reverse の軸は大きい値の側を左か下にする",
      type: "object",
      additionalProperties: false,
      required: ["name"],
      properties: {
        name: { $ref: "#/definitions/text" },
        from: { $ref: "#/definitions/text" },
        to: { $ref: "#/definitions/text" },
        reverse: { type: "boolean" },
      },
    },
  },
};
