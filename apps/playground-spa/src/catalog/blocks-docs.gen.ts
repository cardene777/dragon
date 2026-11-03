// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { docs as actDocs } from "../../../../packages/dragon/src/blocks/act/gallery/docs";
import { rule as actRule } from "../../../../packages/dragon/src/blocks/act/gallery/rule";
import { docs as boxDocs } from "../../../../packages/dragon/src/blocks/box/gallery/docs";
import { rule as boxRule } from "../../../../packages/dragon/src/blocks/box/gallery/rule";
import { docs as branchDocs } from "../../../../packages/dragon/src/blocks/branch/gallery/docs";
import { rule as branchRule } from "../../../../packages/dragon/src/blocks/branch/gallery/rule";
import { docs as carryDocs } from "../../../../packages/dragon/src/blocks/carry/gallery/docs";
import { rule as carryRule } from "../../../../packages/dragon/src/blocks/carry/gallery/rule";
import { docs as colorDocs } from "../../../../packages/dragon/src/blocks/color/gallery/docs";
import { rule as colorRule } from "../../../../packages/dragon/src/blocks/color/gallery/rule";
import { docs as commitDocs } from "../../../../packages/dragon/src/blocks/commit/gallery/docs";
import { rule as commitRule } from "../../../../packages/dragon/src/blocks/commit/gallery/rule";
import { docs as copyDocs } from "../../../../packages/dragon/src/blocks/copy/gallery/docs";
import { rule as copyRule } from "../../../../packages/dragon/src/blocks/copy/gallery/rule";
import { docs as edgeDocs } from "../../../../packages/dragon/src/blocks/edge/gallery/docs";
import { rule as edgeRule } from "../../../../packages/dragon/src/blocks/edge/gallery/rule";
import { docs as edgeLabelDocs } from "../../../../packages/dragon/src/blocks/edge-label/gallery/docs";
import { rule as edgeLabelRule } from "../../../../packages/dragon/src/blocks/edge-label/gallery/rule";
import { docs as groupDocs } from "../../../../packages/dragon/src/blocks/group/gallery/docs";
import { rule as groupRule } from "../../../../packages/dragon/src/blocks/group/gallery/rule";
import { docs as iconDocs } from "../../../../packages/dragon/src/blocks/icon/gallery/docs";
import { rule as iconRule } from "../../../../packages/dragon/src/blocks/icon/gallery/rule";
import { docs as lifelineDocs } from "../../../../packages/dragon/src/blocks/lifeline/gallery/docs";
import { rule as lifelineRule } from "../../../../packages/dragon/src/blocks/lifeline/gallery/rule";
import { docs as linkDocs } from "../../../../packages/dragon/src/blocks/link/gallery/docs";
import { rule as linkRule } from "../../../../packages/dragon/src/blocks/link/gallery/rule";
import { docs as mergeDocs } from "../../../../packages/dragon/src/blocks/merge/gallery/docs";
import { rule as mergeRule } from "../../../../packages/dragon/src/blocks/merge/gallery/rule";
import { docs as noteDocs } from "../../../../packages/dragon/src/blocks/note/gallery/docs";
import { rule as noteRule } from "../../../../packages/dragon/src/blocks/note/gallery/rule";
import { docs as sidePathDocs } from "../../../../packages/dragon/src/blocks/side-path/gallery/docs";
import { rule as sidePathRule } from "../../../../packages/dragon/src/blocks/side-path/gallery/rule";
import { docs as sourceDocs } from "../../../../packages/dragon/src/blocks/source/gallery/docs";
import { rule as sourceRule } from "../../../../packages/dragon/src/blocks/source/gallery/rule";
import { docs as startFinishDocs } from "../../../../packages/dragon/src/blocks/start-finish/gallery/docs";
import { rule as startFinishRule } from "../../../../packages/dragon/src/blocks/start-finish/gallery/rule";
import { docs as stepDocs } from "../../../../packages/dragon/src/blocks/step/gallery/docs";
import { rule as stepRule } from "../../../../packages/dragon/src/blocks/step/gallery/rule";
import { docs as stripDocs } from "../../../../packages/dragon/src/blocks/strip/gallery/docs";
import { rule as stripRule } from "../../../../packages/dragon/src/blocks/strip/gallery/rule";

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

/** `GRAMMAR.md` の部品と使い方の表の行。鍵はブロックの置き場の dir の名前 */
export const BLOCK_RULE = {
  "act": actRule,
  "box": boxRule,
  "branch": branchRule,
  "carry": carryRule,
  "color": colorRule,
  "commit": commitRule,
  "copy": copyRule,
  "edge": edgeRule,
  "edge-label": edgeLabelRule,
  "group": groupRule,
  "icon": iconRule,
  "lifeline": lifelineRule,
  "link": linkRule,
  "merge": mergeRule,
  "note": noteRule,
  "side-path": sidePathRule,
  "source": sourceRule,
  "start-finish": startFinishRule,
  "step": stepRule,
  "strip": stripRule,
} as const;
