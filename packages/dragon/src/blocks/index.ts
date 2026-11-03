// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { block as sourceBlock } from "./source/block";

/** ブロックの一覧。鍵は置き場の dir の名前 */
export const BLOCKS = {
  "source": sourceBlock,
} as const;

/** ブロックの名前。置き場の dir の名前の並び */
export const BLOCK_NAMES = ["source"] as const;
