/**
 * 表のブロックの原本の形の欠片 (#3618)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 表は `blocks.table` に宣言した順に持ち、段の中の行を選ぶ出来事 (`lookup`) と値を書き換える出来事 (`cell`) と式の札の出来事 (`formula`) は、
 * 項目を `<表>.<項目>` の字で名指す。表どうしの関係の図だけが書けることと、結びの先が在る項目かは骨組みと記法を読む処理が確かめる
 */
import type { BlockShape } from "../block";
import { ER_TABLES } from "./block";

export const shape: BlockShape = {
  field: {
    description: "表どうしの関係の図の表。書いた順に左から右へ横 1 列に並べる",
    type: "array",
    minItems: ER_TABLES.least,
    maxItems: ER_TABLES.most,
    items: { $ref: "#/definitions/erTable" },
  },
  definitions: {
    erTable: {
      description: "表。id は項目を <表>.<項目> で名指すので . を持たない。color を書かない表は宣言した順に色の役を配る",
      type: "object",
      additionalProperties: false,
      required: ["id", "name", "fields"],
      properties: {
        id: { type: "string", pattern: "^[^\\s\\[\\]「」=:.]+$" },
        name: { $ref: "#/definitions/text" },
        color: { $ref: "#/definitions/color" },
        fields: { type: "array", minItems: 1, items: { $ref: "#/definitions/erField" } },
      },
    },
    erField: {
      description: "表の項目。key は鍵の印、ref は結びの先の <表>.<項目> で、結びを書いた項目が多い側、指した項目が 1 件の側になる",
      type: "object",
      additionalProperties: false,
      required: ["name", "value"],
      properties: {
        name: { type: "string", pattern: "^[^\\s\\[\\]「」=:.,\"]+$" },
        value: { $ref: "#/definitions/text" },
        key: { const: true },
        ref: { $ref: "#/definitions/erFieldRef" },
      },
    },
    erFieldRef: {
      description: "表の項目を名指す <表>.<項目>",
      type: "string",
      pattern: "^[^\\s\\[\\]「」=:.]+\\.[^\\s\\[\\]「」=:.,\"]+$",
    },
  },
  events: {
    lookup: {
      description: "表どうしの関係の図で、項目 field の行と、その表の枠を光らせる",
      type: "object",
      additionalProperties: false,
      required: ["type", "field"],
      properties: { type: { const: "lookup" }, field: { $ref: "#/definitions/erFieldRef" } },
    },
    cell: {
      description: "表どうしの関係の図で、項目 field の値を value に書き換える。書き換えた値は後の段にも残る",
      type: "object",
      additionalProperties: false,
      required: ["type", "field", "value"],
      properties: { type: { const: "cell" }, field: { $ref: "#/definitions/erFieldRef" }, value: { $ref: "#/definitions/text" } },
    },
    formula: {
      description: "表どうしの関係の図で、項目 field に式の札 text をその段から添える。札は後の段も残る",
      type: "object",
      additionalProperties: false,
      required: ["type", "field", "text"],
      properties: { type: { const: "formula" }, field: { $ref: "#/definitions/erFieldRef" }, text: { $ref: "#/definitions/text" } },
    },
  },
};
