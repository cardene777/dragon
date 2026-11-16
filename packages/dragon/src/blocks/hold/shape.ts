/**
 * hold のブロックの原本の形の欠片 (#3389)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  field: { description: "配管の図の始めの値。残高と、残高でない値を宣言した順に並べる", type: "array", minItems: 1, items: { $ref: "#/definitions/hold" } },
  definitions: {
    amount: { description: "量。0 以上の十進の数を書いた字のまま持つ", type: "string", pattern: "^[0-9]+(\\.[0-9]+)?$" },
    tokenId: { description: "NFT と ERC-1155 のトークンの番号。数字を書いた字のまま持ち、番号ごとに槽を持つ (#3722)", type: "string", pattern: "^[0-9]+$" },
    hold: {
      description: "始めの値。残高は持ち主 box とトークン token と量 amount と、番号を持つトークンの番号 tokenId、残高でない値は持つ Contract box と名前 name と値 value",
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["box", "amount", "token"],
          properties: {
            box: { $ref: "#/definitions/id" },
            amount: { $ref: "#/definitions/amount" },
            token: { description: "トークンの名前。トークンの Contract の名前か、宣言しない決まった名前の ETH", type: "string", pattern: "^[^\\s,]+$" },
            tokenId: { $ref: "#/definitions/tokenId" },
          },
        },
        {
          type: "object",
          additionalProperties: false,
          required: ["box", "name", "value"],
          properties: {
            box: { $ref: "#/definitions/id" },
            name: { $ref: "#/definitions/text" },
            value: { $ref: "#/definitions/text" },
          },
        },
      ],
    },
  },
  events: {
    move: {
      description:
        "トークンの Contract box が、送り手 from の残高から受け手 to へ量 amount を移す。from を省くと受け手の残高だけを増やす発行 (mint)、to を省くと送り手の残高だけを減らす焼却 (burn) で、どちらか片方は必ず書く。tokenId は NFT と ERC-1155 のトークンの番号。配管の図だけが書ける",
      type: "object",
      additionalProperties: false,
      required: ["type", "box", "amount"],
      anyOf: [{ required: ["from"] }, { required: ["to"] }],
      properties: {
        type: { const: "move" },
        box: { $ref: "#/definitions/id" },
        amount: { $ref: "#/definitions/amount" },
        from: { $ref: "#/definitions/id" },
        to: { $ref: "#/definitions/id" },
        tokenId: { $ref: "#/definitions/tokenId" },
      },
    },
  },
};
