/**
 * limit のブロックの原本の形の欠片 (#3624)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import { type None, none } from "../block";

export const shape: None = none("limit は箱の行の鍵で、原本の形は箱の形 (definitions.box) が持つ");
