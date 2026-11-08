/**
 * icon のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";
import { ICON_NAMES } from "./block";
import { TABLER_NAME } from "./set-fields";

export const shape: BlockShape = {
  definitions: {
    icon: { description: "箱と区画のアイコン名。描く部品のアイコンの表 (ICONS) に在る名前だけ", enum: ICON_NAMES },
    // 箱と区画の icon の欄。+ で始まる名前は使う人が足した印のブロックの名前、tabler: で始まる名前は絵柄集の絵柄 (#3493) で、
    // それ以外はアイコン名の一覧から選ぶ (#3399)。
    // anyOf で包むと知らないアイコン名の誤りが 1 つにまとまって近い名前を挙げられないので、頭の字で分ける
    iconField: {
      description: "箱と区画の icon の欄。アイコンの表 (ICONS) に在る名前か、使う人が足した印のブロックの名前 (+ で始まる) か、絵柄集の絵柄 (tabler: で始まる)",
      type: "string",
      if: { pattern: "^\\+" },
      then: { $ref: "#/definitions/userBlockName" },
      else: { if: { pattern: "^tabler:" }, then: { $ref: "#/definitions/setIcon" }, else: { $ref: "#/definitions/icon" } },
    },
    // 絵柄集の絵柄の名前 (#3493)。5,000 を超える名前を形に並べると検査の関数が大きくなるので、形は名前の書き方だけを決め、
    // 絵柄集に在るかは原本の検査 (`validateDiagram`) が登録した絵柄集の表と比べる
    setIcon: { description: "絵柄集 Tabler の線の絵柄の名前 (tabler:<名前>)", type: "string", pattern: TABLER_NAME.source },
    // 箱を元にしたブロックの定義の icon の欄 (#3489)。箱の行と同じ名前を書けるが、足した印のブロックの名前 (+ で始まる) は書けない。
    // box 以外を元にした定義の icon は、定義を読む処理 (`user-blocks-read.ts`) が断る
    blockIcon: {
      description: "箱を元にしたブロックの箱の絵柄。アイコンの表 (ICONS) に在る名前か、絵柄集の絵柄 (tabler: で始まる)",
      type: "string",
      if: { pattern: "^tabler:" },
      then: { $ref: "#/definitions/setIcon" },
      else: { $ref: "#/definitions/icon" },
    },
  },
};
