// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { docs as actDocs } from "../../../../packages/dragon/src/blocks/act/gallery/docs";
import { docs as boxDocs } from "../../../../packages/dragon/src/blocks/box/gallery/docs";
import { docs as branchDocs } from "../../../../packages/dragon/src/blocks/branch/gallery/docs";
import { docs as carryDocs } from "../../../../packages/dragon/src/blocks/carry/gallery/docs";
import { docs as colorDocs } from "../../../../packages/dragon/src/blocks/color/gallery/docs";
import { docs as commitDocs } from "../../../../packages/dragon/src/blocks/commit/gallery/docs";
import { docs as copyDocs } from "../../../../packages/dragon/src/blocks/copy/gallery/docs";
import { docs as edgeDocs } from "../../../../packages/dragon/src/blocks/edge/gallery/docs";
import { docs as edgeLabelDocs } from "../../../../packages/dragon/src/blocks/edge-label/gallery/docs";
import { docs as groupDocs } from "../../../../packages/dragon/src/blocks/group/gallery/docs";
import { docs as iconDocs } from "../../../../packages/dragon/src/blocks/icon/gallery/docs";
import { docs as lifelineDocs } from "../../../../packages/dragon/src/blocks/lifeline/gallery/docs";
import { docs as linkDocs } from "../../../../packages/dragon/src/blocks/link/gallery/docs";
import { docs as mergeDocs } from "../../../../packages/dragon/src/blocks/merge/gallery/docs";
import { docs as noteDocs } from "../../../../packages/dragon/src/blocks/note/gallery/docs";
import { docs as sidePathDocs } from "../../../../packages/dragon/src/blocks/side-path/gallery/docs";
import { docs as sourceDocs } from "../../../../packages/dragon/src/blocks/source/gallery/docs";
import { docs as startFinishDocs } from "../../../../packages/dragon/src/blocks/start-finish/gallery/docs";
import { docs as stepDocs } from "../../../../packages/dragon/src/blocks/step/gallery/docs";
import { docs as stripDocs } from "../../../../packages/dragon/src/blocks/strip/gallery/docs";

/** 使い方の頁の段落。鍵はブロックの置き場の dir の名前 */
export const BLOCK_DOCS = {
  "act": actDocs,
  "box": boxDocs,
  "branch": branchDocs,
  "carry": carryDocs,
  "color": colorDocs,
  "commit": commitDocs,
  "copy": copyDocs,
  "edge": edgeDocs,
  "edge-label": edgeLabelDocs,
  "group": groupDocs,
  "icon": iconDocs,
  "lifeline": lifelineDocs,
  "link": linkDocs,
  "merge": mergeDocs,
  "note": noteDocs,
  "side-path": sidePathDocs,
  "source": sourceDocs,
  "start-finish": startFinishDocs,
  "step": stepDocs,
  "strip": stripDocs,
} as const;
