/**
 * 持ち主ごとのカードのブロックの原本の形の欠片 (#3846)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 最初の段より前から在るカードは `blocks.card` に書いた順に持ち、段の中のカードの出来事 (`card`、`card-move`、`card-delete`、`refuse`) はカードを名札で名指す。
 * 持ち主ごとのカードの図だけが書けることは骨組みが、名指した列とカードが在るかと印の語を持つ列かは記法を読む処理が確かめる
 */
import type { BlockShape } from "../block";
import { AMOUNT_PATTERN } from "./amount";

/** 写しが載る列の名札。書いた順に並べる。同じ列を 2 度書かないことは記法を読む処理が確かめ、形の検査は ajv の部品を足さないよう確かめない */
const columns = { description: "写しが載る列 (箱) の名札。書いた順", type: "array", minItems: 1, items: { $ref: "#/definitions/id" } };

/** カードの欄。段の中で作る出来事も同じ欄を持つ */
const cardFields = {
  id: { $ref: "#/definitions/id" },
  name: { $ref: "#/definitions/text" },
  in: columns,
  amount: { description: "量。数と単位 (1000 USDC)。列の合計は単位ごとに足す", type: "string", pattern: AMOUNT_PATTERN },
  total: { description: "none は量をカードに出すが、列の合計に足さない", enum: ["none"] },
  mark: {
    description: "印を出す列の名札。この列に載る写しにだけ、その列の mark の語の札を出す。選ぶ列は mark の語を持つ",
    type: "array",
    minItems: 1,
    items: { $ref: "#/definitions/id" },
  },
};

export const shape: BlockShape = {
  field: {
    description: "持ち主ごとのカードの図の、最初の段より前から在るカード。in に書いた全ての列に写しが載り、列の中は書いた順に上から積む",
    type: "array",
    items: { $ref: "#/definitions/card" },
  },
  definitions: {
    card: {
      description: "カード。name は見せる名前",
      type: "object",
      additionalProperties: false,
      required: ["id", "name", "in"],
      properties: cardFields,
    },
  },
  events: {
    card: {
      description: "持ち主ごとのカードの図で、その段でカードを作る。作ったカードは in の列の下に足し、その段だけ作った印を出す",
      type: "object",
      additionalProperties: false,
      required: ["type", "id", "name", "in"],
      properties: { type: { const: "card" }, ...cardFields },
    },
    "card-move": {
      description: "持ち主ごとのカードの図で、在るカード card を in の列へ動かす。前の列の写しは消える",
      type: "object",
      additionalProperties: false,
      required: ["type", "card", "in"],
      properties: { type: { const: "card-move" }, card: { $ref: "#/definitions/id" }, in: columns },
    },
    "card-delete": {
      description: "持ち主ごとのカードの図で、カード card を消す。消したカードは消し線で残り、列の合計から外れる",
      type: "object",
      additionalProperties: false,
      required: ["type", "card"],
      properties: { type: { const: "card-delete" }, card: { $ref: "#/definitions/id" } },
    },
    refuse: {
      description: "持ち主ごとのカードの図で、カードか列 target が断られる。カードは変わらず、断られた札と理由 reason の札を出す",
      type: "object",
      additionalProperties: false,
      required: ["type", "target", "reason"],
      properties: { type: { const: "refuse" }, target: { $ref: "#/definitions/id" }, reason: { $ref: "#/definitions/text" } },
    },
  },
};
