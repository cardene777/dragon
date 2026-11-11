// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { block as actBlock } from "./act/block";
import { block as askBlock } from "./ask/block";
import { block as boxBlock } from "./box/block";
import { block as branchBlock } from "./branch/block";
import { block as calcBlock } from "./calc/block";
import { block as callBlock } from "./call/block";
import { block as carryBlock } from "./carry/block";
import { block as chainBlock } from "./chain/block";
import { block as chartItemBlock } from "./chart-item/block";
import { block as chartSetBlock } from "./chart-set/block";
import { block as chartShapeBlock } from "./chart-shape/block";
import { block as checkBlock } from "./check/block";
import { block as choiceBlock } from "./choice/block";
import { block as circleBlock } from "./circle/block";
import { block as colorBlock } from "./color/block";
import { block as commitBlock } from "./commit/block";
import { block as copyBlock } from "./copy/block";
import { block as deleteBlock } from "./delete/block";
import { block as edgeBlock } from "./edge/block";
import { block as edgeLabelBlock } from "./edge-label/block";
import { block as emitBlock } from "./emit/block";
import { block as foldBlock } from "./fold/block";
import { block as gistBlock } from "./gist/block";
import { block as groupBlock } from "./group/block";
import { block as holdBlock } from "./hold/block";
import { block as iconBlock } from "./icon/block";
import { block as itemBlock } from "./item/block";
import { block as leafBlock } from "./leaf/block";
import { block as legendBlock } from "./legend/block";
import { block as lifelineBlock } from "./lifeline/block";
import { block as lineBlock } from "./line/block";
import { block as linkBlock } from "./link/block";
import { block as logBlock } from "./log/block";
import { block as mergeBlock } from "./merge/block";
import { block as nodeBlock } from "./node/block";
import { block as noteBlock } from "./note/block";
import { block as orderBlock } from "./order/block";
import { block as pickBlock } from "./pick/block";
import { block as pointBlock } from "./point/block";
import { block as pressBlock } from "./press/block";
import { block as queueBlock } from "./queue/block";
import { block as returnBlock } from "./return/block";
import { block as revertBlock } from "./revert/block";
import { block as ringBlock } from "./ring/block";
import { block as roleBlock } from "./role/block";
import { block as routeBlock } from "./route/block";
import { block as rowBlock } from "./row/block";
import { block as scaleBlock } from "./scale/block";
import { block as sealBlock } from "./seal/block";
import { block as sideBlock } from "./side/block";
import { block as sidePathBlock } from "./side-path/block";
import { block as sourceBlock } from "./source/block";
import { block as stampBlock } from "./stamp/block";
import { block as startFinishBlock } from "./start-finish/block";
import { block as stepBlock } from "./step/block";
import { block as stripBlock } from "./strip/block";
import { block as tableBlock } from "./table/block";
import { block as taskBlock } from "./task/block";
import { block as valueBlock } from "./value/block";
import { block as writeBlock } from "./write/block";
import { block as zoomBlock } from "./zoom/block";

/** ブロックの一覧。鍵は置き場の dir の名前 */
export const BLOCKS = {
  "act": actBlock,
  "ask": askBlock,
  "box": boxBlock,
  "branch": branchBlock,
  "calc": calcBlock,
  "call": callBlock,
  "carry": carryBlock,
  "chain": chainBlock,
  "chart-item": chartItemBlock,
  "chart-set": chartSetBlock,
  "chart-shape": chartShapeBlock,
  "check": checkBlock,
  "choice": choiceBlock,
  "circle": circleBlock,
  "color": colorBlock,
  "commit": commitBlock,
  "copy": copyBlock,
  "delete": deleteBlock,
  "edge": edgeBlock,
  "edge-label": edgeLabelBlock,
  "emit": emitBlock,
  "fold": foldBlock,
  "gist": gistBlock,
  "group": groupBlock,
  "hold": holdBlock,
  "icon": iconBlock,
  "item": itemBlock,
  "leaf": leafBlock,
  "legend": legendBlock,
  "lifeline": lifelineBlock,
  "line": lineBlock,
  "link": linkBlock,
  "log": logBlock,
  "merge": mergeBlock,
  "node": nodeBlock,
  "note": noteBlock,
  "order": orderBlock,
  "pick": pickBlock,
  "point": pointBlock,
  "press": pressBlock,
  "queue": queueBlock,
  "return": returnBlock,
  "revert": revertBlock,
  "ring": ringBlock,
  "role": roleBlock,
  "route": routeBlock,
  "row": rowBlock,
  "scale": scaleBlock,
  "seal": sealBlock,
  "side": sideBlock,
  "side-path": sidePathBlock,
  "source": sourceBlock,
  "stamp": stampBlock,
  "start-finish": startFinishBlock,
  "step": stepBlock,
  "strip": stripBlock,
  "table": tableBlock,
  "task": taskBlock,
  "value": valueBlock,
  "write": writeBlock,
  "zoom": zoomBlock,
} as const;

/** ブロックの名前。置き場の dir の名前の並び */
export const BLOCK_NAMES = ["act", "ask", "box", "branch", "calc", "call", "carry", "chain", "chart-item", "chart-set", "chart-shape", "check", "choice", "circle", "color", "commit", "copy", "delete", "edge", "edge-label", "emit", "fold", "gist", "group", "hold", "icon", "item", "leaf", "legend", "lifeline", "line", "link", "log", "merge", "node", "note", "order", "pick", "point", "press", "queue", "return", "revert", "ring", "role", "route", "row", "scale", "seal", "side", "side-path", "source", "stamp", "start-finish", "step", "strip", "table", "task", "value", "write", "zoom"] as const;
