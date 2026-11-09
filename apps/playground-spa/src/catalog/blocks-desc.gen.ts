// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { desc as actDesc } from "../../../../packages/dragon/src/blocks/act/gallery/desc";
import { desc as askDesc } from "../../../../packages/dragon/src/blocks/ask/gallery/desc";
import { desc as boxDesc } from "../../../../packages/dragon/src/blocks/box/gallery/desc";
import { desc as branchDesc } from "../../../../packages/dragon/src/blocks/branch/gallery/desc";
import { desc as calcDesc } from "../../../../packages/dragon/src/blocks/calc/gallery/desc";
import { desc as callDesc } from "../../../../packages/dragon/src/blocks/call/gallery/desc";
import { desc as carryDesc } from "../../../../packages/dragon/src/blocks/carry/gallery/desc";
import { desc as chainDesc } from "../../../../packages/dragon/src/blocks/chain/gallery/desc";
import { desc as chartItemDesc } from "../../../../packages/dragon/src/blocks/chart-item/gallery/desc";
import { desc as chartSetDesc } from "../../../../packages/dragon/src/blocks/chart-set/gallery/desc";
import { desc as chartShapeDesc } from "../../../../packages/dragon/src/blocks/chart-shape/gallery/desc";
import { desc as checkDesc } from "../../../../packages/dragon/src/blocks/check/gallery/desc";
import { desc as choiceDesc } from "../../../../packages/dragon/src/blocks/choice/gallery/desc";
import { desc as colorDesc } from "../../../../packages/dragon/src/blocks/color/gallery/desc";
import { desc as commitDesc } from "../../../../packages/dragon/src/blocks/commit/gallery/desc";
import { desc as copyDesc } from "../../../../packages/dragon/src/blocks/copy/gallery/desc";
import { desc as edgeDesc } from "../../../../packages/dragon/src/blocks/edge/gallery/desc";
import { desc as edgeLabelDesc } from "../../../../packages/dragon/src/blocks/edge-label/gallery/desc";
import { desc as emitDesc } from "../../../../packages/dragon/src/blocks/emit/gallery/desc";
import { desc as foldDesc } from "../../../../packages/dragon/src/blocks/fold/gallery/desc";
import { desc as gistDesc } from "../../../../packages/dragon/src/blocks/gist/gallery/desc";
import { desc as groupDesc } from "../../../../packages/dragon/src/blocks/group/gallery/desc";
import { desc as holdDesc } from "../../../../packages/dragon/src/blocks/hold/gallery/desc";
import { desc as iconDesc } from "../../../../packages/dragon/src/blocks/icon/gallery/desc";
import { desc as itemDesc } from "../../../../packages/dragon/src/blocks/item/gallery/desc";
import { desc as leafDesc } from "../../../../packages/dragon/src/blocks/leaf/gallery/desc";
import { desc as legendDesc } from "../../../../packages/dragon/src/blocks/legend/gallery/desc";
import { desc as lifelineDesc } from "../../../../packages/dragon/src/blocks/lifeline/gallery/desc";
import { desc as lineDesc } from "../../../../packages/dragon/src/blocks/line/gallery/desc";
import { desc as linkDesc } from "../../../../packages/dragon/src/blocks/link/gallery/desc";
import { desc as logDesc } from "../../../../packages/dragon/src/blocks/log/gallery/desc";
import { desc as mergeDesc } from "../../../../packages/dragon/src/blocks/merge/gallery/desc";
import { desc as nodeDesc } from "../../../../packages/dragon/src/blocks/node/gallery/desc";
import { desc as noteDesc } from "../../../../packages/dragon/src/blocks/note/gallery/desc";
import { desc as orderDesc } from "../../../../packages/dragon/src/blocks/order/gallery/desc";
import { desc as pickDesc } from "../../../../packages/dragon/src/blocks/pick/gallery/desc";
import { desc as pointDesc } from "../../../../packages/dragon/src/blocks/point/gallery/desc";
import { desc as pressDesc } from "../../../../packages/dragon/src/blocks/press/gallery/desc";
import { desc as queueDesc } from "../../../../packages/dragon/src/blocks/queue/gallery/desc";
import { desc as returnDesc } from "../../../../packages/dragon/src/blocks/return/gallery/desc";
import { desc as revertDesc } from "../../../../packages/dragon/src/blocks/revert/gallery/desc";
import { desc as roleDesc } from "../../../../packages/dragon/src/blocks/role/gallery/desc";
import { desc as routeDesc } from "../../../../packages/dragon/src/blocks/route/gallery/desc";
import { desc as rowDesc } from "../../../../packages/dragon/src/blocks/row/gallery/desc";
import { desc as scaleDesc } from "../../../../packages/dragon/src/blocks/scale/gallery/desc";
import { desc as sealDesc } from "../../../../packages/dragon/src/blocks/seal/gallery/desc";
import { desc as sideDesc } from "../../../../packages/dragon/src/blocks/side/gallery/desc";
import { desc as sidePathDesc } from "../../../../packages/dragon/src/blocks/side-path/gallery/desc";
import { desc as sourceDesc } from "../../../../packages/dragon/src/blocks/source/gallery/desc";
import { desc as stampDesc } from "../../../../packages/dragon/src/blocks/stamp/gallery/desc";
import { desc as startFinishDesc } from "../../../../packages/dragon/src/blocks/start-finish/gallery/desc";
import { desc as stepDesc } from "../../../../packages/dragon/src/blocks/step/gallery/desc";
import { desc as stripDesc } from "../../../../packages/dragon/src/blocks/strip/gallery/desc";
import { desc as taskDesc } from "../../../../packages/dragon/src/blocks/task/gallery/desc";
import { desc as valueDesc } from "../../../../packages/dragon/src/blocks/value/gallery/desc";
import { desc as writeDesc } from "../../../../packages/dragon/src/blocks/write/gallery/desc";
import { desc as zoomDesc } from "../../../../packages/dragon/src/blocks/zoom/gallery/desc";

/** 部品の頁の説明。鍵はブロックの置き場の dir の名前 */
export const BLOCK_DESC = {
  "act": actDesc,
  "ask": askDesc,
  "box": boxDesc,
  "branch": branchDesc,
  "calc": calcDesc,
  "call": callDesc,
  "carry": carryDesc,
  "chain": chainDesc,
  "chart-item": chartItemDesc,
  "chart-set": chartSetDesc,
  "chart-shape": chartShapeDesc,
  "check": checkDesc,
  "choice": choiceDesc,
  "color": colorDesc,
  "commit": commitDesc,
  "copy": copyDesc,
  "edge": edgeDesc,
  "edge-label": edgeLabelDesc,
  "emit": emitDesc,
  "fold": foldDesc,
  "gist": gistDesc,
  "group": groupDesc,
  "hold": holdDesc,
  "icon": iconDesc,
  "item": itemDesc,
  "leaf": leafDesc,
  "legend": legendDesc,
  "lifeline": lifelineDesc,
  "line": lineDesc,
  "link": linkDesc,
  "log": logDesc,
  "merge": mergeDesc,
  "node": nodeDesc,
  "note": noteDesc,
  "order": orderDesc,
  "pick": pickDesc,
  "point": pointDesc,
  "press": pressDesc,
  "queue": queueDesc,
  "return": returnDesc,
  "revert": revertDesc,
  "role": roleDesc,
  "route": routeDesc,
  "row": rowDesc,
  "scale": scaleDesc,
  "seal": sealDesc,
  "side": sideDesc,
  "side-path": sidePathDesc,
  "source": sourceDesc,
  "stamp": stampDesc,
  "start-finish": startFinishDesc,
  "step": stepDesc,
  "strip": stripDesc,
  "task": taskDesc,
  "value": valueDesc,
  "write": writeDesc,
  "zoom": zoomDesc,
} as const;
