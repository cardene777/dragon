// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { reading as actReading } from "./act/read";
import { reading as askReading } from "./ask/read";
import { reading as boxReading } from "./box/read";
import { reading as branchReading } from "./branch/read";
import { reading as calcReading } from "./calc/read";
import { reading as callReading } from "./call/read";
import { reading as carryReading } from "./carry/read";
import { reading as chainReading } from "./chain/read";
import { reading as chartItemReading } from "./chart-item/read";
import { reading as chartSetReading } from "./chart-set/read";
import { reading as chartShapeReading } from "./chart-shape/read";
import { reading as checkReading } from "./check/read";
import { reading as choiceReading } from "./choice/read";
import { reading as colorReading } from "./color/read";
import { reading as commitReading } from "./commit/read";
import { reading as copyReading } from "./copy/read";
import { reading as edgeReading } from "./edge/read";
import { reading as edgeLabelReading } from "./edge-label/read";
import { reading as emitReading } from "./emit/read";
import { reading as foldReading } from "./fold/read";
import { reading as gistReading } from "./gist/read";
import { reading as groupReading } from "./group/read";
import { reading as holdReading } from "./hold/read";
import { reading as iconReading } from "./icon/read";
import { reading as itemReading } from "./item/read";
import { reading as leafReading } from "./leaf/read";
import { reading as legendReading } from "./legend/read";
import { reading as lifelineReading } from "./lifeline/read";
import { reading as lineReading } from "./line/read";
import { reading as linkReading } from "./link/read";
import { reading as logReading } from "./log/read";
import { reading as mergeReading } from "./merge/read";
import { reading as nodeReading } from "./node/read";
import { reading as noteReading } from "./note/read";
import { reading as orderReading } from "./order/read";
import { reading as pickReading } from "./pick/read";
import { reading as pointReading } from "./point/read";
import { reading as pressReading } from "./press/read";
import { reading as queueReading } from "./queue/read";
import { reading as returnReading } from "./return/read";
import { reading as revertReading } from "./revert/read";
import { reading as ringReading } from "./ring/read";
import { reading as roleReading } from "./role/read";
import { reading as routeReading } from "./route/read";
import { reading as rowReading } from "./row/read";
import { reading as scaleReading } from "./scale/read";
import { reading as sealReading } from "./seal/read";
import { reading as sideReading } from "./side/read";
import { reading as sidePathReading } from "./side-path/read";
import { reading as sourceReading } from "./source/read";
import { reading as stampReading } from "./stamp/read";
import { reading as startFinishReading } from "./start-finish/read";
import { reading as stepReading } from "./step/read";
import { reading as stripReading } from "./strip/read";
import { reading as tableReading } from "./table/read";
import { reading as taskReading } from "./task/read";
import { reading as valueReading } from "./value/read";
import { reading as writeReading } from "./write/read";
import { reading as zoomReading } from "./zoom/read";

/** 全てのブロックの読み方。鍵は置き場の dir の名前。全部入りの入口と検査が読み、軽い入口は読まない (#3349) */
export const READINGS = {
  "act": actReading,
  "ask": askReading,
  "box": boxReading,
  "branch": branchReading,
  "calc": calcReading,
  "call": callReading,
  "carry": carryReading,
  "chain": chainReading,
  "chart-item": chartItemReading,
  "chart-set": chartSetReading,
  "chart-shape": chartShapeReading,
  "check": checkReading,
  "choice": choiceReading,
  "color": colorReading,
  "commit": commitReading,
  "copy": copyReading,
  "edge": edgeReading,
  "edge-label": edgeLabelReading,
  "emit": emitReading,
  "fold": foldReading,
  "gist": gistReading,
  "group": groupReading,
  "hold": holdReading,
  "icon": iconReading,
  "item": itemReading,
  "leaf": leafReading,
  "legend": legendReading,
  "lifeline": lifelineReading,
  "line": lineReading,
  "link": linkReading,
  "log": logReading,
  "merge": mergeReading,
  "node": nodeReading,
  "note": noteReading,
  "order": orderReading,
  "pick": pickReading,
  "point": pointReading,
  "press": pressReading,
  "queue": queueReading,
  "return": returnReading,
  "revert": revertReading,
  "ring": ringReading,
  "role": roleReading,
  "route": routeReading,
  "row": rowReading,
  "scale": scaleReading,
  "seal": sealReading,
  "side": sideReading,
  "side-path": sidePathReading,
  "source": sourceReading,
  "stamp": stampReading,
  "start-finish": startFinishReading,
  "step": stepReading,
  "strip": stripReading,
  "table": tableReading,
  "task": taskReading,
  "value": valueReading,
  "write": writeReading,
  "zoom": zoomReading,
} as const;
