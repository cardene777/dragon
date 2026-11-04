/**
 * queue のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import { type None, none } from "../block";

export const shape: None = none("待ち行列は試す図の部品の 1 つで、原本の形は部品の欄 (blocks.part) の判別で 5 つの部品の枝を持つ骨組みの部品の形 (definitions.part) が持つ");
