/**
 * 集まりの円のブロックの原本の形の欠片 (#3620)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 集まりは `blocks.circle` に宣言した順に持ち、段の中の数の出来事 (`count`) は集まりを名札で名指す。
 * 名札は重なりを `&` で繋いで書くので `&` を持たず、どれにも入らない数の語 `none` にもしない。
 * 集合の重なりの図だけが書けることは骨組みが、名指した集まりが在るかと重なりの数が集まりの数を超えないかは記法を読む処理が確かめる
 */
import type { BlockShape } from "../block";
import { VENN_SETS } from "./limits";

/** 集まりの名札。名札に使える字のうち `&` を除き、`none` を除く */
const vennId = { type: "string", pattern: "^(?!none$)[^\\s\\[\\]「」=:&]+$" };

export const shape: BlockShape = {
  field: {
    description: "集合の重なりの図の集まり。宣言した順に円を置く。2 つの集まりは左右に、3 つの集まりは左上と右上と下に置く",
    type: "array",
    minItems: VENN_SETS.least,
    maxItems: VENN_SETS.most,
    items: { $ref: "#/definitions/vennSet" },
  },
  definitions: {
    vennSet: {
      description: "集まり。name は円の外に出す名前で、color を書かない集まりは宣言した順に色の役を配る",
      type: "object",
      additionalProperties: false,
      required: ["id", "name"],
      properties: {
        id: vennId,
        name: { $ref: "#/definitions/text" },
        color: { $ref: "#/definitions/color" },
      },
    },
  },
  events: {
    count: {
      description: "集合の重なりの図で、集まりか重なりの数を value にする。sets が 1 つなら集まりの数で、その段で円が現れる。2 つ以上なら重なりの数で、その段で重なりの区画が光る",
      type: "object",
      additionalProperties: false,
      required: ["type", "sets", "value"],
      properties: {
        type: { const: "count" },
        sets: { description: "数を書く集まりの名札。同じ名札を 2 度書かない (記法を読む時に止める)", type: "array", minItems: 1, maxItems: VENN_SETS.most, items: vennId },
        value: { description: "数。単位を持たない 0 以上の数", type: "number", minimum: 0 },
      },
    },
    none: {
      description: "集合の重なりの図で、どれにも入らない数を value にする。その段で円の外の枠に出す",
      type: "object",
      additionalProperties: false,
      required: ["type", "value"],
      properties: {
        type: { const: "none" },
        value: { description: "数。単位を持たない 0 以上の数", type: "number", minimum: 0 },
      },
    },
  },
};
