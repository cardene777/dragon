/**
 * 場面のブロックの原本の形の欠片 (#3878)。
 *
 * 場面は原本の根の `scenes` の欄で骨組み (`schemas/base.schema.json`) が形を持ち、場面の段は段の形 (`definitions.step`) を使う。
 * このブロックは原本の `blocks` に自分の欄を持たない
 */
import { type None, none } from "../block";

export const shape: None = none("場面は原本の根の scenes の欄で骨組みが形を持ち、場面の段は段の形を使う");
