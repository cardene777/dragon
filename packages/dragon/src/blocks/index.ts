// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { block as actBlock } from "./act/block";
import { block as boxBlock } from "./box/block";
import { block as branchBlock } from "./branch/block";
import { block as carryBlock } from "./carry/block";
import { block as colorBlock } from "./color/block";
import { block as commitBlock } from "./commit/block";
import { block as copyBlock } from "./copy/block";
import { block as edgeBlock } from "./edge/block";
import { block as edgeLabelBlock } from "./edge-label/block";
import { block as groupBlock } from "./group/block";
import { block as iconBlock } from "./icon/block";
import { block as lifelineBlock } from "./lifeline/block";
import { block as linkBlock } from "./link/block";
import { block as mergeBlock } from "./merge/block";
import { block as noteBlock } from "./note/block";
import { block as sidePathBlock } from "./side-path/block";
import { block as sourceBlock } from "./source/block";
import { block as startFinishBlock } from "./start-finish/block";
import { block as stepBlock } from "./step/block";
import { block as stripBlock } from "./strip/block";

/** ブロックの一覧。鍵は置き場の dir の名前 */
export const BLOCKS = {
  "act": actBlock,
  "box": boxBlock,
  "branch": branchBlock,
  "carry": carryBlock,
  "color": colorBlock,
  "commit": commitBlock,
  "copy": copyBlock,
  "edge": edgeBlock,
  "edge-label": edgeLabelBlock,
  "group": groupBlock,
  "icon": iconBlock,
  "lifeline": lifelineBlock,
  "link": linkBlock,
  "merge": mergeBlock,
  "note": noteBlock,
  "side-path": sidePathBlock,
  "source": sourceBlock,
  "start-finish": startFinishBlock,
  "step": stepBlock,
  "strip": stripBlock,
} as const;

/** ブロックの名前。置き場の dir の名前の並び */
export const BLOCK_NAMES = ["act", "box", "branch", "carry", "color", "commit", "copy", "edge", "edge-label", "group", "icon", "lifeline", "link", "merge", "note", "side-path", "source", "start-finish", "step", "strip"] as const;
