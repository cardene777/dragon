// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { text as actText } from "../../../../packages/dragon/src/blocks/act/gallery/text";
import { shelf as actShelf } from "../../../../packages/dragon/src/blocks/act/gallery/shelf";
import { rule as actRule } from "../../../../packages/dragon/src/blocks/act/gallery/rule";
import { text as askText } from "../../../../packages/dragon/src/blocks/ask/gallery/text";
import { shelf as askShelf } from "../../../../packages/dragon/src/blocks/ask/gallery/shelf";
import { rule as askRule } from "../../../../packages/dragon/src/blocks/ask/gallery/rule";
import { text as boxText } from "../../../../packages/dragon/src/blocks/box/gallery/text";
import { shelf as boxShelf } from "../../../../packages/dragon/src/blocks/box/gallery/shelf";
import { rule as boxRule } from "../../../../packages/dragon/src/blocks/box/gallery/rule";
import { text as branchText } from "../../../../packages/dragon/src/blocks/branch/gallery/text";
import { shelf as branchShelf } from "../../../../packages/dragon/src/blocks/branch/gallery/shelf";
import { rule as branchRule } from "../../../../packages/dragon/src/blocks/branch/gallery/rule";
import { text as calcText } from "../../../../packages/dragon/src/blocks/calc/gallery/text";
import { shelf as calcShelf } from "../../../../packages/dragon/src/blocks/calc/gallery/shelf";
import { rule as calcRule } from "../../../../packages/dragon/src/blocks/calc/gallery/rule";
import { text as callText } from "../../../../packages/dragon/src/blocks/call/gallery/text";
import { shelf as callShelf } from "../../../../packages/dragon/src/blocks/call/gallery/shelf";
import { rule as callRule } from "../../../../packages/dragon/src/blocks/call/gallery/rule";
import { text as carryText } from "../../../../packages/dragon/src/blocks/carry/gallery/text";
import { shelf as carryShelf } from "../../../../packages/dragon/src/blocks/carry/gallery/shelf";
import { rule as carryRule } from "../../../../packages/dragon/src/blocks/carry/gallery/rule";
import { text as chainText } from "../../../../packages/dragon/src/blocks/chain/gallery/text";
import { shelf as chainShelf } from "../../../../packages/dragon/src/blocks/chain/gallery/shelf";
import { rule as chainRule } from "../../../../packages/dragon/src/blocks/chain/gallery/rule";
import { text as checkText } from "../../../../packages/dragon/src/blocks/check/gallery/text";
import { shelf as checkShelf } from "../../../../packages/dragon/src/blocks/check/gallery/shelf";
import { rule as checkRule } from "../../../../packages/dragon/src/blocks/check/gallery/rule";
import { text as colorText } from "../../../../packages/dragon/src/blocks/color/gallery/text";
import { shelf as colorShelf } from "../../../../packages/dragon/src/blocks/color/gallery/shelf";
import { rule as colorRule } from "../../../../packages/dragon/src/blocks/color/gallery/rule";
import { text as commitText } from "../../../../packages/dragon/src/blocks/commit/gallery/text";
import { shelf as commitShelf } from "../../../../packages/dragon/src/blocks/commit/gallery/shelf";
import { rule as commitRule } from "../../../../packages/dragon/src/blocks/commit/gallery/rule";
import { text as copyText } from "../../../../packages/dragon/src/blocks/copy/gallery/text";
import { shelf as copyShelf } from "../../../../packages/dragon/src/blocks/copy/gallery/shelf";
import { rule as copyRule } from "../../../../packages/dragon/src/blocks/copy/gallery/rule";
import { text as edgeText } from "../../../../packages/dragon/src/blocks/edge/gallery/text";
import { shelf as edgeShelf } from "../../../../packages/dragon/src/blocks/edge/gallery/shelf";
import { rule as edgeRule } from "../../../../packages/dragon/src/blocks/edge/gallery/rule";
import { text as edgeLabelText } from "../../../../packages/dragon/src/blocks/edge-label/gallery/text";
import { shelf as edgeLabelShelf } from "../../../../packages/dragon/src/blocks/edge-label/gallery/shelf";
import { rule as edgeLabelRule } from "../../../../packages/dragon/src/blocks/edge-label/gallery/rule";
import { text as emitText } from "../../../../packages/dragon/src/blocks/emit/gallery/text";
import { shelf as emitShelf } from "../../../../packages/dragon/src/blocks/emit/gallery/shelf";
import { rule as emitRule } from "../../../../packages/dragon/src/blocks/emit/gallery/rule";
import { text as foldText } from "../../../../packages/dragon/src/blocks/fold/gallery/text";
import { shelf as foldShelf } from "../../../../packages/dragon/src/blocks/fold/gallery/shelf";
import { rule as foldRule } from "../../../../packages/dragon/src/blocks/fold/gallery/rule";
import { text as gistText } from "../../../../packages/dragon/src/blocks/gist/gallery/text";
import { shelf as gistShelf } from "../../../../packages/dragon/src/blocks/gist/gallery/shelf";
import { rule as gistRule } from "../../../../packages/dragon/src/blocks/gist/gallery/rule";
import { text as groupText } from "../../../../packages/dragon/src/blocks/group/gallery/text";
import { shelf as groupShelf } from "../../../../packages/dragon/src/blocks/group/gallery/shelf";
import { rule as groupRule } from "../../../../packages/dragon/src/blocks/group/gallery/rule";
import { text as holdText } from "../../../../packages/dragon/src/blocks/hold/gallery/text";
import { shelf as holdShelf } from "../../../../packages/dragon/src/blocks/hold/gallery/shelf";
import { rule as holdRule } from "../../../../packages/dragon/src/blocks/hold/gallery/rule";
import { text as iconText } from "../../../../packages/dragon/src/blocks/icon/gallery/text";
import { shelf as iconShelf } from "../../../../packages/dragon/src/blocks/icon/gallery/shelf";
import { rule as iconRule } from "../../../../packages/dragon/src/blocks/icon/gallery/rule";
import { text as itemText } from "../../../../packages/dragon/src/blocks/item/gallery/text";
import { shelf as itemShelf } from "../../../../packages/dragon/src/blocks/item/gallery/shelf";
import { rule as itemRule } from "../../../../packages/dragon/src/blocks/item/gallery/rule";
import { text as leafText } from "../../../../packages/dragon/src/blocks/leaf/gallery/text";
import { shelf as leafShelf } from "../../../../packages/dragon/src/blocks/leaf/gallery/shelf";
import { rule as leafRule } from "../../../../packages/dragon/src/blocks/leaf/gallery/rule";
import { text as legendText } from "../../../../packages/dragon/src/blocks/legend/gallery/text";
import { shelf as legendShelf } from "../../../../packages/dragon/src/blocks/legend/gallery/shelf";
import { rule as legendRule } from "../../../../packages/dragon/src/blocks/legend/gallery/rule";
import { text as lifelineText } from "../../../../packages/dragon/src/blocks/lifeline/gallery/text";
import { shelf as lifelineShelf } from "../../../../packages/dragon/src/blocks/lifeline/gallery/shelf";
import { rule as lifelineRule } from "../../../../packages/dragon/src/blocks/lifeline/gallery/rule";
import { text as lineText } from "../../../../packages/dragon/src/blocks/line/gallery/text";
import { shelf as lineShelf } from "../../../../packages/dragon/src/blocks/line/gallery/shelf";
import { rule as lineRule } from "../../../../packages/dragon/src/blocks/line/gallery/rule";
import { text as linkText } from "../../../../packages/dragon/src/blocks/link/gallery/text";
import { shelf as linkShelf } from "../../../../packages/dragon/src/blocks/link/gallery/shelf";
import { rule as linkRule } from "../../../../packages/dragon/src/blocks/link/gallery/rule";
import { text as logText } from "../../../../packages/dragon/src/blocks/log/gallery/text";
import { shelf as logShelf } from "../../../../packages/dragon/src/blocks/log/gallery/shelf";
import { rule as logRule } from "../../../../packages/dragon/src/blocks/log/gallery/rule";
import { text as mergeText } from "../../../../packages/dragon/src/blocks/merge/gallery/text";
import { shelf as mergeShelf } from "../../../../packages/dragon/src/blocks/merge/gallery/shelf";
import { rule as mergeRule } from "../../../../packages/dragon/src/blocks/merge/gallery/rule";
import { text as nodeText } from "../../../../packages/dragon/src/blocks/node/gallery/text";
import { shelf as nodeShelf } from "../../../../packages/dragon/src/blocks/node/gallery/shelf";
import { rule as nodeRule } from "../../../../packages/dragon/src/blocks/node/gallery/rule";
import { text as noteText } from "../../../../packages/dragon/src/blocks/note/gallery/text";
import { shelf as noteShelf } from "../../../../packages/dragon/src/blocks/note/gallery/shelf";
import { rule as noteRule } from "../../../../packages/dragon/src/blocks/note/gallery/rule";
import { text as orderText } from "../../../../packages/dragon/src/blocks/order/gallery/text";
import { shelf as orderShelf } from "../../../../packages/dragon/src/blocks/order/gallery/shelf";
import { rule as orderRule } from "../../../../packages/dragon/src/blocks/order/gallery/rule";
import { text as pickText } from "../../../../packages/dragon/src/blocks/pick/gallery/text";
import { shelf as pickShelf } from "../../../../packages/dragon/src/blocks/pick/gallery/shelf";
import { rule as pickRule } from "../../../../packages/dragon/src/blocks/pick/gallery/rule";
import { text as pointText } from "../../../../packages/dragon/src/blocks/point/gallery/text";
import { shelf as pointShelf } from "../../../../packages/dragon/src/blocks/point/gallery/shelf";
import { rule as pointRule } from "../../../../packages/dragon/src/blocks/point/gallery/rule";
import { text as pressText } from "../../../../packages/dragon/src/blocks/press/gallery/text";
import { shelf as pressShelf } from "../../../../packages/dragon/src/blocks/press/gallery/shelf";
import { rule as pressRule } from "../../../../packages/dragon/src/blocks/press/gallery/rule";
import { text as queueText } from "../../../../packages/dragon/src/blocks/queue/gallery/text";
import { shelf as queueShelf } from "../../../../packages/dragon/src/blocks/queue/gallery/shelf";
import { rule as queueRule } from "../../../../packages/dragon/src/blocks/queue/gallery/rule";
import { text as returnText } from "../../../../packages/dragon/src/blocks/return/gallery/text";
import { shelf as returnShelf } from "../../../../packages/dragon/src/blocks/return/gallery/shelf";
import { rule as returnRule } from "../../../../packages/dragon/src/blocks/return/gallery/rule";
import { text as revertText } from "../../../../packages/dragon/src/blocks/revert/gallery/text";
import { shelf as revertShelf } from "../../../../packages/dragon/src/blocks/revert/gallery/shelf";
import { rule as revertRule } from "../../../../packages/dragon/src/blocks/revert/gallery/rule";
import { text as roleText } from "../../../../packages/dragon/src/blocks/role/gallery/text";
import { shelf as roleShelf } from "../../../../packages/dragon/src/blocks/role/gallery/shelf";
import { rule as roleRule } from "../../../../packages/dragon/src/blocks/role/gallery/rule";
import { text as routeText } from "../../../../packages/dragon/src/blocks/route/gallery/text";
import { shelf as routeShelf } from "../../../../packages/dragon/src/blocks/route/gallery/shelf";
import { rule as routeRule } from "../../../../packages/dragon/src/blocks/route/gallery/rule";
import { text as rowText } from "../../../../packages/dragon/src/blocks/row/gallery/text";
import { shelf as rowShelf } from "../../../../packages/dragon/src/blocks/row/gallery/shelf";
import { rule as rowRule } from "../../../../packages/dragon/src/blocks/row/gallery/rule";
import { text as scaleText } from "../../../../packages/dragon/src/blocks/scale/gallery/text";
import { shelf as scaleShelf } from "../../../../packages/dragon/src/blocks/scale/gallery/shelf";
import { rule as scaleRule } from "../../../../packages/dragon/src/blocks/scale/gallery/rule";
import { text as sealText } from "../../../../packages/dragon/src/blocks/seal/gallery/text";
import { shelf as sealShelf } from "../../../../packages/dragon/src/blocks/seal/gallery/shelf";
import { rule as sealRule } from "../../../../packages/dragon/src/blocks/seal/gallery/rule";
import { text as sideText } from "../../../../packages/dragon/src/blocks/side/gallery/text";
import { shelf as sideShelf } from "../../../../packages/dragon/src/blocks/side/gallery/shelf";
import { rule as sideRule } from "../../../../packages/dragon/src/blocks/side/gallery/rule";
import { text as sidePathText } from "../../../../packages/dragon/src/blocks/side-path/gallery/text";
import { shelf as sidePathShelf } from "../../../../packages/dragon/src/blocks/side-path/gallery/shelf";
import { rule as sidePathRule } from "../../../../packages/dragon/src/blocks/side-path/gallery/rule";
import { text as sourceText } from "../../../../packages/dragon/src/blocks/source/gallery/text";
import { shelf as sourceShelf } from "../../../../packages/dragon/src/blocks/source/gallery/shelf";
import { rule as sourceRule } from "../../../../packages/dragon/src/blocks/source/gallery/rule";
import { text as stampText } from "../../../../packages/dragon/src/blocks/stamp/gallery/text";
import { shelf as stampShelf } from "../../../../packages/dragon/src/blocks/stamp/gallery/shelf";
import { rule as stampRule } from "../../../../packages/dragon/src/blocks/stamp/gallery/rule";
import { text as startFinishText } from "../../../../packages/dragon/src/blocks/start-finish/gallery/text";
import { shelf as startFinishShelf } from "../../../../packages/dragon/src/blocks/start-finish/gallery/shelf";
import { rule as startFinishRule } from "../../../../packages/dragon/src/blocks/start-finish/gallery/rule";
import { text as stepText } from "../../../../packages/dragon/src/blocks/step/gallery/text";
import { shelf as stepShelf } from "../../../../packages/dragon/src/blocks/step/gallery/shelf";
import { rule as stepRule } from "../../../../packages/dragon/src/blocks/step/gallery/rule";
import { text as stripText } from "../../../../packages/dragon/src/blocks/strip/gallery/text";
import { shelf as stripShelf } from "../../../../packages/dragon/src/blocks/strip/gallery/shelf";
import { rule as stripRule } from "../../../../packages/dragon/src/blocks/strip/gallery/rule";
import { text as taskText } from "../../../../packages/dragon/src/blocks/task/gallery/text";
import { shelf as taskShelf } from "../../../../packages/dragon/src/blocks/task/gallery/shelf";
import { rule as taskRule } from "../../../../packages/dragon/src/blocks/task/gallery/rule";
import { text as valueText } from "../../../../packages/dragon/src/blocks/value/gallery/text";
import { shelf as valueShelf } from "../../../../packages/dragon/src/blocks/value/gallery/shelf";
import { rule as valueRule } from "../../../../packages/dragon/src/blocks/value/gallery/rule";
import { text as writeText } from "../../../../packages/dragon/src/blocks/write/gallery/text";
import { shelf as writeShelf } from "../../../../packages/dragon/src/blocks/write/gallery/shelf";
import { rule as writeRule } from "../../../../packages/dragon/src/blocks/write/gallery/rule";
import { text as zoomText } from "../../../../packages/dragon/src/blocks/zoom/gallery/text";
import { shelf as zoomShelf } from "../../../../packages/dragon/src/blocks/zoom/gallery/shelf";
import { rule as zoomRule } from "../../../../packages/dragon/src/blocks/zoom/gallery/rule";

/** 見本帳の一覧の名前。鍵はブロックの置き場の dir の名前 */
export const BLOCK_TEXT = {
  "act": actText,
  "ask": askText,
  "box": boxText,
  "branch": branchText,
  "calc": calcText,
  "call": callText,
  "carry": carryText,
  "chain": chainText,
  "check": checkText,
  "color": colorText,
  "commit": commitText,
  "copy": copyText,
  "edge": edgeText,
  "edge-label": edgeLabelText,
  "emit": emitText,
  "fold": foldText,
  "gist": gistText,
  "group": groupText,
  "hold": holdText,
  "icon": iconText,
  "item": itemText,
  "leaf": leafText,
  "legend": legendText,
  "lifeline": lifelineText,
  "line": lineText,
  "link": linkText,
  "log": logText,
  "merge": mergeText,
  "node": nodeText,
  "note": noteText,
  "order": orderText,
  "pick": pickText,
  "point": pointText,
  "press": pressText,
  "queue": queueText,
  "return": returnText,
  "revert": revertText,
  "role": roleText,
  "route": routeText,
  "row": rowText,
  "scale": scaleText,
  "seal": sealText,
  "side": sideText,
  "side-path": sidePathText,
  "source": sourceText,
  "stamp": stampText,
  "start-finish": startFinishText,
  "step": stepText,
  "strip": stripText,
  "task": taskText,
  "value": valueText,
  "write": writeText,
  "zoom": zoomText,
} as const;

/** 編集画面の棚に置く部品。鍵はブロックの置き場の dir の名前 */
export const BLOCK_SHELF = {
  "act": actShelf,
  "ask": askShelf,
  "box": boxShelf,
  "branch": branchShelf,
  "calc": calcShelf,
  "call": callShelf,
  "carry": carryShelf,
  "chain": chainShelf,
  "check": checkShelf,
  "color": colorShelf,
  "commit": commitShelf,
  "copy": copyShelf,
  "edge": edgeShelf,
  "edge-label": edgeLabelShelf,
  "emit": emitShelf,
  "fold": foldShelf,
  "gist": gistShelf,
  "group": groupShelf,
  "hold": holdShelf,
  "icon": iconShelf,
  "item": itemShelf,
  "leaf": leafShelf,
  "legend": legendShelf,
  "lifeline": lifelineShelf,
  "line": lineShelf,
  "link": linkShelf,
  "log": logShelf,
  "merge": mergeShelf,
  "node": nodeShelf,
  "note": noteShelf,
  "order": orderShelf,
  "pick": pickShelf,
  "point": pointShelf,
  "press": pressShelf,
  "queue": queueShelf,
  "return": returnShelf,
  "revert": revertShelf,
  "role": roleShelf,
  "route": routeShelf,
  "row": rowShelf,
  "scale": scaleShelf,
  "seal": sealShelf,
  "side": sideShelf,
  "side-path": sidePathShelf,
  "source": sourceShelf,
  "stamp": stampShelf,
  "start-finish": startFinishShelf,
  "step": stepShelf,
  "strip": stripShelf,
  "task": taskShelf,
  "value": valueShelf,
  "write": writeShelf,
  "zoom": zoomShelf,
} as const;

/** `GRAMMAR.md` の部品と使い方の表の行。鍵はブロックの置き場の dir の名前 */
export const BLOCK_RULE = {
  "act": actRule,
  "ask": askRule,
  "box": boxRule,
  "branch": branchRule,
  "calc": calcRule,
  "call": callRule,
  "carry": carryRule,
  "chain": chainRule,
  "check": checkRule,
  "color": colorRule,
  "commit": commitRule,
  "copy": copyRule,
  "edge": edgeRule,
  "edge-label": edgeLabelRule,
  "emit": emitRule,
  "fold": foldRule,
  "gist": gistRule,
  "group": groupRule,
  "hold": holdRule,
  "icon": iconRule,
  "item": itemRule,
  "leaf": leafRule,
  "legend": legendRule,
  "lifeline": lifelineRule,
  "line": lineRule,
  "link": linkRule,
  "log": logRule,
  "merge": mergeRule,
  "node": nodeRule,
  "note": noteRule,
  "order": orderRule,
  "pick": pickRule,
  "point": pointRule,
  "press": pressRule,
  "queue": queueRule,
  "return": returnRule,
  "revert": revertRule,
  "role": roleRule,
  "route": routeRule,
  "row": rowRule,
  "scale": scaleRule,
  "seal": sealRule,
  "side": sideRule,
  "side-path": sidePathRule,
  "source": sourceRule,
  "stamp": stampRule,
  "start-finish": startFinishRule,
  "step": stepRule,
  "strip": stripRule,
  "task": taskRule,
  "value": valueRule,
  "write": writeRule,
  "zoom": zoomRule,
} as const;

/** ブロックの名前をブロックの並び (`block.ts` の `rank`) の順に。見本帳の一覧と棚と使い方の頁は、この順にブロックの見本帳の分を並べる */
export const BLOCK_ORDER = ["start-finish", "branch", "commit", "copy", "merge", "group", "box", "lifeline", "strip", "side-path", "step", "source", "act", "note", "edge", "carry", "edge-label", "color", "icon", "link", "scale", "row", "task", "point", "zoom", "leaf", "node", "item", "line", "seal", "pick", "stamp", "role", "order", "legend", "route", "queue", "chain", "log", "ask", "press", "side", "hold", "write", "return", "call", "value", "check", "emit", "calc", "revert", "fold", "gist"] as const;
