// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { block as actBlock } from "./act/block";
import { block as edgeLabelBlock } from "./edge-label/block";
import { block as noteBlock } from "./note/block";
import { block as sourceBlock } from "./source/block";
import { block as stripBlock } from "./strip/block";

/** ブロックの一覧。鍵は置き場の dir の名前 */
export const BLOCKS = {
  "act": actBlock,
  "edge-label": edgeLabelBlock,
  "note": noteBlock,
  "source": sourceBlock,
  "strip": stripBlock,
} as const;

/** ブロックの名前。置き場の dir の名前の並び */
export const BLOCK_NAMES = ["act", "edge-label", "note", "source", "strip"] as const;
