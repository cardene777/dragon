// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { uses as actUses } from "../../../../packages/dragon/src/blocks/act/gallery/uses";
import { uses as askUses } from "../../../../packages/dragon/src/blocks/ask/gallery/uses";
import { uses as boxUses } from "../../../../packages/dragon/src/blocks/box/gallery/uses";
import { uses as branchUses } from "../../../../packages/dragon/src/blocks/branch/gallery/uses";
import { uses as carryUses } from "../../../../packages/dragon/src/blocks/carry/gallery/uses";
import { uses as chainUses } from "../../../../packages/dragon/src/blocks/chain/gallery/uses";
import { uses as colorUses } from "../../../../packages/dragon/src/blocks/color/gallery/uses";
import { uses as commitUses } from "../../../../packages/dragon/src/blocks/commit/gallery/uses";
import { uses as copyUses } from "../../../../packages/dragon/src/blocks/copy/gallery/uses";
import { uses as edgeUses } from "../../../../packages/dragon/src/blocks/edge/gallery/uses";
import { uses as edgeLabelUses } from "../../../../packages/dragon/src/blocks/edge-label/gallery/uses";
import { uses as groupUses } from "../../../../packages/dragon/src/blocks/group/gallery/uses";
import { uses as iconUses } from "../../../../packages/dragon/src/blocks/icon/gallery/uses";
import { uses as itemUses } from "../../../../packages/dragon/src/blocks/item/gallery/uses";
import { uses as leafUses } from "../../../../packages/dragon/src/blocks/leaf/gallery/uses";
import { uses as legendUses } from "../../../../packages/dragon/src/blocks/legend/gallery/uses";
import { uses as lifelineUses } from "../../../../packages/dragon/src/blocks/lifeline/gallery/uses";
import { uses as lineUses } from "../../../../packages/dragon/src/blocks/line/gallery/uses";
import { uses as linkUses } from "../../../../packages/dragon/src/blocks/link/gallery/uses";
import { uses as mergeUses } from "../../../../packages/dragon/src/blocks/merge/gallery/uses";
import { uses as nodeUses } from "../../../../packages/dragon/src/blocks/node/gallery/uses";
import { uses as noteUses } from "../../../../packages/dragon/src/blocks/note/gallery/uses";
import { uses as orderUses } from "../../../../packages/dragon/src/blocks/order/gallery/uses";
import { uses as pickUses } from "../../../../packages/dragon/src/blocks/pick/gallery/uses";
import { uses as pointUses } from "../../../../packages/dragon/src/blocks/point/gallery/uses";
import { uses as pressUses } from "../../../../packages/dragon/src/blocks/press/gallery/uses";
import { uses as queueUses } from "../../../../packages/dragon/src/blocks/queue/gallery/uses";
import { uses as roleUses } from "../../../../packages/dragon/src/blocks/role/gallery/uses";
import { uses as routeUses } from "../../../../packages/dragon/src/blocks/route/gallery/uses";
import { uses as rowUses } from "../../../../packages/dragon/src/blocks/row/gallery/uses";
import { uses as scaleUses } from "../../../../packages/dragon/src/blocks/scale/gallery/uses";
import { uses as sealUses } from "../../../../packages/dragon/src/blocks/seal/gallery/uses";
import { uses as sidePathUses } from "../../../../packages/dragon/src/blocks/side-path/gallery/uses";
import { uses as sourceUses } from "../../../../packages/dragon/src/blocks/source/gallery/uses";
import { uses as stampUses } from "../../../../packages/dragon/src/blocks/stamp/gallery/uses";
import { uses as startFinishUses } from "../../../../packages/dragon/src/blocks/start-finish/gallery/uses";
import { uses as stepUses } from "../../../../packages/dragon/src/blocks/step/gallery/uses";
import { uses as stripUses } from "../../../../packages/dragon/src/blocks/strip/gallery/uses";
import { uses as zoomUses } from "../../../../packages/dragon/src/blocks/zoom/gallery/uses";

/** 部品の頁が、見本がブロックの語を使ったかを決める関数。鍵はブロックの置き場の dir の名前 */
export const BLOCK_USES = {
  "act": actUses,
  "ask": askUses,
  "box": boxUses,
  "branch": branchUses,
  "carry": carryUses,
  "chain": chainUses,
  "color": colorUses,
  "commit": commitUses,
  "copy": copyUses,
  "edge": edgeUses,
  "edge-label": edgeLabelUses,
  "group": groupUses,
  "icon": iconUses,
  "item": itemUses,
  "leaf": leafUses,
  "legend": legendUses,
  "lifeline": lifelineUses,
  "line": lineUses,
  "link": linkUses,
  "merge": mergeUses,
  "node": nodeUses,
  "note": noteUses,
  "order": orderUses,
  "pick": pickUses,
  "point": pointUses,
  "press": pressUses,
  "queue": queueUses,
  "role": roleUses,
  "route": routeUses,
  "row": rowUses,
  "scale": scaleUses,
  "seal": sealUses,
  "side-path": sidePathUses,
  "source": sourceUses,
  "stamp": stampUses,
  "start-finish": startFinishUses,
  "step": stepUses,
  "strip": stripUses,
  "zoom": zoomUses,
} as const;
