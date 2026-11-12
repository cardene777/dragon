/**
 * item のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";
import { LABEL_MOST, LAYERS_MOST, LINEUP_SHAPES } from "./block";

export const shape: BlockShape = {
  // 列の図のチップと試す図のチップは形が違うので、チップの形は図の種類の決まり (骨組みの `item` の `items`) が選ぶ (#3337)
  field: { type: "array", minItems: 1, description: "チップ。列の図と試す図だけが書け、形は図の種類の決まりが持つ" },
  definitions: {
    item: {
      description: "チップ。color を書かないチップは薄い色で、label を書かないチップは名前を出す。note を書いたチップは図の下の凡例にその説明を出す",
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { $ref: "#/definitions/id" },
        color: { $ref: "#/definitions/color" },
        label: { description: "チップに載せる字", type: "string", minLength: 1, maxLength: LABEL_MOST },
        note: { description: "図の下の凡例に出す、チップの説明", $ref: "#/definitions/text" },
      },
    },
    // 列の図の見た目 (#3625)。列の図の決まりはチップのブロックが持つので、骨組みの根の `lineup` の欄が引く形もここに置く
    lineupLook: {
      description:
        "列の図の見た目。layers は箱を書いた順に上から横の帯に重ね、札が段ごとに帯を下りて、帯ごとの note を印に残す。stations は箱を書いた順に 1 本の流れの線の上の駅にし、札を駅の下に積んで、札が線の上を次の駅へ走る",
      type: "object",
      additionalProperties: false,
      required: ["shape"],
      properties: {
        shape: { description: "列の図の見た目の名前", enum: [...LINEUP_SHAPES] },
      },
    },
    // 層の見た目の列の図の箱と出来事。層の見た目で描かない物を、受け付けたまま描かずに捨てないよう断る
    layersBoxes: {
      description: "層の見た目の列の図の箱。8 つまでで、順番の無い置き場にできず、上限 (limit) を持たない",
      maxItems: LAYERS_MOST,
      items: { properties: { order: { $ref: "#/definitions/absent" }, limit: { $ref: "#/definitions/absent" } } },
    },
    notLayersEvent: {
      description: "列の図の層の見た目で描かない出来事 (封、開ける、選ぶ、札、役) を書けない",
      not: { required: ["type"], properties: { type: { enum: ["seal", "open", "pick", "stamp", "role"] } } },
    },
    // 流れの線の見た目 (#3624) の列の図の出来事。流れの線で描かない物を、受け付けたまま描かずに捨てないよう断る。役は流れの線でも描く
    notStationsEvent: {
      description: "列の図の流れの線の見た目で描かない出来事 (封、開ける、選ぶ、札) を書けない",
      not: { required: ["type"], properties: { type: { enum: ["seal", "open", "pick", "stamp"] } } },
    },
  },
};
