// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { text as actText } from "../../../../packages/dragon/src/blocks/act/gallery/text";
import { shelf as actShelf } from "../../../../packages/dragon/src/blocks/act/gallery/shelf";
import { text as boxText } from "../../../../packages/dragon/src/blocks/box/gallery/text";
import { shelf as boxShelf } from "../../../../packages/dragon/src/blocks/box/gallery/shelf";
import { text as branchText } from "../../../../packages/dragon/src/blocks/branch/gallery/text";
import { shelf as branchShelf } from "../../../../packages/dragon/src/blocks/branch/gallery/shelf";
import { text as carryText } from "../../../../packages/dragon/src/blocks/carry/gallery/text";
import { shelf as carryShelf } from "../../../../packages/dragon/src/blocks/carry/gallery/shelf";
import { text as colorText } from "../../../../packages/dragon/src/blocks/color/gallery/text";
import { shelf as colorShelf } from "../../../../packages/dragon/src/blocks/color/gallery/shelf";
import { text as commitText } from "../../../../packages/dragon/src/blocks/commit/gallery/text";
import { shelf as commitShelf } from "../../../../packages/dragon/src/blocks/commit/gallery/shelf";
import { text as copyText } from "../../../../packages/dragon/src/blocks/copy/gallery/text";
import { shelf as copyShelf } from "../../../../packages/dragon/src/blocks/copy/gallery/shelf";
import { text as edgeText } from "../../../../packages/dragon/src/blocks/edge/gallery/text";
import { shelf as edgeShelf } from "../../../../packages/dragon/src/blocks/edge/gallery/shelf";
import { text as edgeLabelText } from "../../../../packages/dragon/src/blocks/edge-label/gallery/text";
import { shelf as edgeLabelShelf } from "../../../../packages/dragon/src/blocks/edge-label/gallery/shelf";
import { text as groupText } from "../../../../packages/dragon/src/blocks/group/gallery/text";
import { shelf as groupShelf } from "../../../../packages/dragon/src/blocks/group/gallery/shelf";
import { text as iconText } from "../../../../packages/dragon/src/blocks/icon/gallery/text";
import { shelf as iconShelf } from "../../../../packages/dragon/src/blocks/icon/gallery/shelf";
import { text as lifelineText } from "../../../../packages/dragon/src/blocks/lifeline/gallery/text";
import { shelf as lifelineShelf } from "../../../../packages/dragon/src/blocks/lifeline/gallery/shelf";
import { text as linkText } from "../../../../packages/dragon/src/blocks/link/gallery/text";
import { shelf as linkShelf } from "../../../../packages/dragon/src/blocks/link/gallery/shelf";
import { text as mergeText } from "../../../../packages/dragon/src/blocks/merge/gallery/text";
import { shelf as mergeShelf } from "../../../../packages/dragon/src/blocks/merge/gallery/shelf";
import { text as noteText } from "../../../../packages/dragon/src/blocks/note/gallery/text";
import { shelf as noteShelf } from "../../../../packages/dragon/src/blocks/note/gallery/shelf";
import { text as sidePathText } from "../../../../packages/dragon/src/blocks/side-path/gallery/text";
import { shelf as sidePathShelf } from "../../../../packages/dragon/src/blocks/side-path/gallery/shelf";
import { text as sourceText } from "../../../../packages/dragon/src/blocks/source/gallery/text";
import { shelf as sourceShelf } from "../../../../packages/dragon/src/blocks/source/gallery/shelf";
import { text as startFinishText } from "../../../../packages/dragon/src/blocks/start-finish/gallery/text";
import { shelf as startFinishShelf } from "../../../../packages/dragon/src/blocks/start-finish/gallery/shelf";
import { text as stepText } from "../../../../packages/dragon/src/blocks/step/gallery/text";
import { shelf as stepShelf } from "../../../../packages/dragon/src/blocks/step/gallery/shelf";
import { text as stripText } from "../../../../packages/dragon/src/blocks/strip/gallery/text";
import { shelf as stripShelf } from "../../../../packages/dragon/src/blocks/strip/gallery/shelf";

/** 見本帳の一覧の名前と説明。鍵はブロックの置き場の dir の名前 */
export const BLOCK_TEXT = {
  "act": actText,
  "box": boxText,
  "branch": branchText,
  "carry": carryText,
  "color": colorText,
  "commit": commitText,
  "copy": copyText,
  "edge": edgeText,
  "edge-label": edgeLabelText,
  "group": groupText,
  "icon": iconText,
  "lifeline": lifelineText,
  "link": linkText,
  "merge": mergeText,
  "note": noteText,
  "side-path": sidePathText,
  "source": sourceText,
  "start-finish": startFinishText,
  "step": stepText,
  "strip": stripText,
} as const;

/** 編集画面の棚に置く部品の名前。鍵はブロックの置き場の dir の名前 */
export const BLOCK_SHELF = {
  "act": actShelf,
  "box": boxShelf,
  "branch": branchShelf,
  "carry": carryShelf,
  "color": colorShelf,
  "commit": commitShelf,
  "copy": copyShelf,
  "edge": edgeShelf,
  "edge-label": edgeLabelShelf,
  "group": groupShelf,
  "icon": iconShelf,
  "lifeline": lifelineShelf,
  "link": linkShelf,
  "merge": mergeShelf,
  "note": noteShelf,
  "side-path": sidePathShelf,
  "source": sourceShelf,
  "start-finish": startFinishShelf,
  "step": stepShelf,
  "strip": stripShelf,
} as const;
