/**
 * check のブロックの原本の形の欠片 (#3389)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 配管の図の段の中の確認は段の出来事 (`events.check`)、試す図の網の節の関門 (#3476) は原本の欄 (`blocks.check`) に持つ。
 */
import type { BlockShape } from "../block";
import { CHECK_OPS } from "./block";

export const shape: BlockShape = {
  field: {
    description: "試す図の網の節の関門 (#3476)。最初の step より前の check の行を書いた順に持ち、送ったチップは網の道で着いた節の関門を書いた順に確かめる。試す図だけが書ける",
    type: "array",
    minItems: 1,
    items: { $ref: "#/definitions/tryCheck" },
  },
  definitions: {
    tryCheck: {
      description:
        "関門。入力の帯の欄 field の値を op で value と比べて成り立てば通り、成り立たなければ節 node で止まり、記録の列 into にエラーの名前 no を持つ記録が増える。value が数なら欄の値も数として比べる。retry は再試行できる拒否の印",
      type: "object",
      additionalProperties: false,
      required: ["node", "field", "op", "value", "no", "into"],
      properties: {
        node: { $ref: "#/definitions/id" },
        field: { $ref: "#/definitions/id" },
        op: { enum: [...CHECK_OPS] },
        value: { $ref: "#/definitions/text" },
        no: { $ref: "#/definitions/text" },
        retry: { const: true },
        into: { $ref: "#/definitions/id" },
      },
    },
  },
  events: {
    check: {
      description: "box が left と right を op で比べる。両側が数なら dragon が比べ、数でない確認は fail を書いた時だけ落ちる。配管の図だけが書ける",
      type: "object",
      additionalProperties: false,
      required: ["type", "box", "left", "op", "right"],
      properties: {
        type: { const: "check" },
        box: { $ref: "#/definitions/id" },
        left: { $ref: "#/definitions/text" },
        op: { enum: [">=", "<=", "==", "!=", ">", "<"] },
        right: { $ref: "#/definitions/text" },
        fail: { const: true },
      },
    },
  },
};
