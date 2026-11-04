// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { docs as actDocs } from "../../../../packages/dragon/src/blocks/act/gallery/docs";
import { docs as askDocs } from "../../../../packages/dragon/src/blocks/ask/gallery/docs";
import { docs as boxDocs } from "../../../../packages/dragon/src/blocks/box/gallery/docs";
import { docs as branchDocs } from "../../../../packages/dragon/src/blocks/branch/gallery/docs";
import { docs as carryDocs } from "../../../../packages/dragon/src/blocks/carry/gallery/docs";
import { docs as chainDocs } from "../../../../packages/dragon/src/blocks/chain/gallery/docs";
import { docs as colorDocs } from "../../../../packages/dragon/src/blocks/color/gallery/docs";
import { docs as commitDocs } from "../../../../packages/dragon/src/blocks/commit/gallery/docs";
import { docs as copyDocs } from "../../../../packages/dragon/src/blocks/copy/gallery/docs";
import { docs as edgeDocs } from "../../../../packages/dragon/src/blocks/edge/gallery/docs";
import { docs as edgeLabelDocs } from "../../../../packages/dragon/src/blocks/edge-label/gallery/docs";
import { docs as groupDocs } from "../../../../packages/dragon/src/blocks/group/gallery/docs";
import { docs as iconDocs } from "../../../../packages/dragon/src/blocks/icon/gallery/docs";
import { docs as itemDocs } from "../../../../packages/dragon/src/blocks/item/gallery/docs";
import { docs as leafDocs } from "../../../../packages/dragon/src/blocks/leaf/gallery/docs";
import { docs as legendDocs } from "../../../../packages/dragon/src/blocks/legend/gallery/docs";
import { docs as lifelineDocs } from "../../../../packages/dragon/src/blocks/lifeline/gallery/docs";
import { docs as lineDocs } from "../../../../packages/dragon/src/blocks/line/gallery/docs";
import { docs as linkDocs } from "../../../../packages/dragon/src/blocks/link/gallery/docs";
import { docs as mergeDocs } from "../../../../packages/dragon/src/blocks/merge/gallery/docs";
import { docs as nodeDocs } from "../../../../packages/dragon/src/blocks/node/gallery/docs";
import { docs as noteDocs } from "../../../../packages/dragon/src/blocks/note/gallery/docs";
import { docs as orderDocs } from "../../../../packages/dragon/src/blocks/order/gallery/docs";
import { docs as pickDocs } from "../../../../packages/dragon/src/blocks/pick/gallery/docs";
import { docs as pointDocs } from "../../../../packages/dragon/src/blocks/point/gallery/docs";
import { docs as pressDocs } from "../../../../packages/dragon/src/blocks/press/gallery/docs";
import { docs as queueDocs } from "../../../../packages/dragon/src/blocks/queue/gallery/docs";
import { docs as roleDocs } from "../../../../packages/dragon/src/blocks/role/gallery/docs";
import { docs as routeDocs } from "../../../../packages/dragon/src/blocks/route/gallery/docs";
import { docs as rowDocs } from "../../../../packages/dragon/src/blocks/row/gallery/docs";
import { docs as scaleDocs } from "../../../../packages/dragon/src/blocks/scale/gallery/docs";
import { docs as sealDocs } from "../../../../packages/dragon/src/blocks/seal/gallery/docs";
import { docs as sidePathDocs } from "../../../../packages/dragon/src/blocks/side-path/gallery/docs";
import { docs as sourceDocs } from "../../../../packages/dragon/src/blocks/source/gallery/docs";
import { docs as stampDocs } from "../../../../packages/dragon/src/blocks/stamp/gallery/docs";
import { docs as startFinishDocs } from "../../../../packages/dragon/src/blocks/start-finish/gallery/docs";
import { docs as stepDocs } from "../../../../packages/dragon/src/blocks/step/gallery/docs";
import { docs as stripDocs } from "../../../../packages/dragon/src/blocks/strip/gallery/docs";
import { docs as zoomDocs } from "../../../../packages/dragon/src/blocks/zoom/gallery/docs";

/** 使い方の頁の段落。鍵はブロックの置き場の dir の名前 */
export const BLOCK_DOCS = {
  "act": actDocs,
  "ask": askDocs,
  "box": boxDocs,
  "branch": branchDocs,
  "carry": carryDocs,
  "chain": chainDocs,
  "color": colorDocs,
  "commit": commitDocs,
  "copy": copyDocs,
  "edge": edgeDocs,
  "edge-label": edgeLabelDocs,
  "group": groupDocs,
  "icon": iconDocs,
  "item": itemDocs,
  "leaf": leafDocs,
  "legend": legendDocs,
  "lifeline": lifelineDocs,
  "line": lineDocs,
  "link": linkDocs,
  "merge": mergeDocs,
  "node": nodeDocs,
  "note": noteDocs,
  "order": orderDocs,
  "pick": pickDocs,
  "point": pointDocs,
  "press": pressDocs,
  "queue": queueDocs,
  "role": roleDocs,
  "route": routeDocs,
  "row": rowDocs,
  "scale": scaleDocs,
  "seal": sealDocs,
  "side-path": sidePathDocs,
  "source": sourceDocs,
  "stamp": stampDocs,
  "start-finish": startFinishDocs,
  "step": stepDocs,
  "strip": stripDocs,
  "zoom": zoomDocs,
} as const;
