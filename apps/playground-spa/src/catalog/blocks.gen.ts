// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { text as actText } from "../../../../packages/dragon/src/blocks/act/gallery/text";
import { shelf as actShelf } from "../../../../packages/dragon/src/blocks/act/gallery/shelf";
import { rule as actRule } from "../../../../packages/dragon/src/blocks/act/gallery/rule";
import { text as boxText } from "../../../../packages/dragon/src/blocks/box/gallery/text";
import { shelf as boxShelf } from "../../../../packages/dragon/src/blocks/box/gallery/shelf";
import { rule as boxRule } from "../../../../packages/dragon/src/blocks/box/gallery/rule";
import { text as branchText } from "../../../../packages/dragon/src/blocks/branch/gallery/text";
import { shelf as branchShelf } from "../../../../packages/dragon/src/blocks/branch/gallery/shelf";
import { rule as branchRule } from "../../../../packages/dragon/src/blocks/branch/gallery/rule";
import { text as carryText } from "../../../../packages/dragon/src/blocks/carry/gallery/text";
import { shelf as carryShelf } from "../../../../packages/dragon/src/blocks/carry/gallery/shelf";
import { rule as carryRule } from "../../../../packages/dragon/src/blocks/carry/gallery/rule";
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
import { text as groupText } from "../../../../packages/dragon/src/blocks/group/gallery/text";
import { shelf as groupShelf } from "../../../../packages/dragon/src/blocks/group/gallery/shelf";
import { rule as groupRule } from "../../../../packages/dragon/src/blocks/group/gallery/rule";
import { text as iconText } from "../../../../packages/dragon/src/blocks/icon/gallery/text";
import { shelf as iconShelf } from "../../../../packages/dragon/src/blocks/icon/gallery/shelf";
import { rule as iconRule } from "../../../../packages/dragon/src/blocks/icon/gallery/rule";
import { text as lifelineText } from "../../../../packages/dragon/src/blocks/lifeline/gallery/text";
import { shelf as lifelineShelf } from "../../../../packages/dragon/src/blocks/lifeline/gallery/shelf";
import { rule as lifelineRule } from "../../../../packages/dragon/src/blocks/lifeline/gallery/rule";
import { text as linkText } from "../../../../packages/dragon/src/blocks/link/gallery/text";
import { shelf as linkShelf } from "../../../../packages/dragon/src/blocks/link/gallery/shelf";
import { rule as linkRule } from "../../../../packages/dragon/src/blocks/link/gallery/rule";
import { text as mergeText } from "../../../../packages/dragon/src/blocks/merge/gallery/text";
import { shelf as mergeShelf } from "../../../../packages/dragon/src/blocks/merge/gallery/shelf";
import { rule as mergeRule } from "../../../../packages/dragon/src/blocks/merge/gallery/rule";
import { text as noteText } from "../../../../packages/dragon/src/blocks/note/gallery/text";
import { shelf as noteShelf } from "../../../../packages/dragon/src/blocks/note/gallery/shelf";
import { rule as noteRule } from "../../../../packages/dragon/src/blocks/note/gallery/rule";
import { text as sidePathText } from "../../../../packages/dragon/src/blocks/side-path/gallery/text";
import { shelf as sidePathShelf } from "../../../../packages/dragon/src/blocks/side-path/gallery/shelf";
import { rule as sidePathRule } from "../../../../packages/dragon/src/blocks/side-path/gallery/rule";
import { text as sourceText } from "../../../../packages/dragon/src/blocks/source/gallery/text";
import { shelf as sourceShelf } from "../../../../packages/dragon/src/blocks/source/gallery/shelf";
import { rule as sourceRule } from "../../../../packages/dragon/src/blocks/source/gallery/rule";
import { text as startFinishText } from "../../../../packages/dragon/src/blocks/start-finish/gallery/text";
import { shelf as startFinishShelf } from "../../../../packages/dragon/src/blocks/start-finish/gallery/shelf";
import { rule as startFinishRule } from "../../../../packages/dragon/src/blocks/start-finish/gallery/rule";
import { text as stepText } from "../../../../packages/dragon/src/blocks/step/gallery/text";
import { shelf as stepShelf } from "../../../../packages/dragon/src/blocks/step/gallery/shelf";
import { rule as stepRule } from "../../../../packages/dragon/src/blocks/step/gallery/rule";
import { text as stripText } from "../../../../packages/dragon/src/blocks/strip/gallery/text";
import { shelf as stripShelf } from "../../../../packages/dragon/src/blocks/strip/gallery/shelf";
import { rule as stripRule } from "../../../../packages/dragon/src/blocks/strip/gallery/rule";

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
