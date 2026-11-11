/**
 * ring のブロックの原本の形の欠片 (#3623)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import { type None, none } from "../block";

export const shape: None = none("輪は手順の箱と線から並べ、原本に輪の欄は無い。手順の数の決まりは図の種類ごとの決まりと一緒に base.schema.json が持つ");
