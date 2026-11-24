/**
 * 押すと出る札のブロックの原本の形の欠片 (#3877)。
 *
 * 札の見せ方は原本の根の `note` の欄で骨組み (`schemas/base.schema.json`) が、例は箱の `example` の欄で箱のブロックの形の欠片が持つ。
 * このブロックは原本の `blocks` に自分の欄を持たない
 */
import { type None, none } from "../block";

export const shape: None = none("札の見せ方は原本の根の note の欄で骨組みが、例は箱の example の欄で箱のブロックが形の欠片を持つ");
