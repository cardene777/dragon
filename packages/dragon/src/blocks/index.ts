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
import { block as itemBlock } from "./item/block";
import { block as leafBlock } from "./leaf/block";
import { block as legendBlock } from "./legend/block";
import { block as lifelineBlock } from "./lifeline/block";
import { block as lineBlock } from "./line/block";
import { block as linkBlock } from "./link/block";
import { block as mergeBlock } from "./merge/block";
import { block as nodeBlock } from "./node/block";
import { block as noteBlock } from "./note/block";
import { block as orderBlock } from "./order/block";
import { block as pickBlock } from "./pick/block";
import { block as pointBlock } from "./point/block";
import { block as roleBlock } from "./role/block";
import { block as rowBlock } from "./row/block";
import { block as scaleBlock } from "./scale/block";
import { block as sealBlock } from "./seal/block";
import { block as sidePathBlock } from "./side-path/block";
import { block as sourceBlock } from "./source/block";
import { block as stampBlock } from "./stamp/block";
import { block as startFinishBlock } from "./start-finish/block";
import { block as stepBlock } from "./step/block";
import { block as stripBlock } from "./strip/block";
import { block as zoomBlock } from "./zoom/block";

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
  "item": itemBlock,
  "leaf": leafBlock,
  "legend": legendBlock,
  "lifeline": lifelineBlock,
  "line": lineBlock,
  "link": linkBlock,
  "merge": mergeBlock,
  "node": nodeBlock,
  "note": noteBlock,
  "order": orderBlock,
  "pick": pickBlock,
  "point": pointBlock,
  "role": roleBlock,
  "row": rowBlock,
  "scale": scaleBlock,
  "seal": sealBlock,
  "side-path": sidePathBlock,
  "source": sourceBlock,
  "stamp": stampBlock,
  "start-finish": startFinishBlock,
  "step": stepBlock,
  "strip": stripBlock,
  "zoom": zoomBlock,
} as const;

/** ブロックの名前。置き場の dir の名前の並び */
export const BLOCK_NAMES = ["act", "box", "branch", "carry", "color", "commit", "copy", "edge", "edge-label", "group", "icon", "item", "leaf", "legend", "lifeline", "line", "link", "merge", "node", "note", "order", "pick", "point", "role", "row", "scale", "seal", "side-path", "source", "stamp", "start-finish", "step", "strip", "zoom"] as const;
