// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { text as actText } from "../../../../packages/dragon/src/blocks/act/gallery/text";
import { shelf as actShelf } from "../../../../packages/dragon/src/blocks/act/gallery/shelf";
import { docs as actDocs } from "../../../../packages/dragon/src/blocks/act/gallery/docs";
import { rule as actRule } from "../../../../packages/dragon/src/blocks/act/gallery/rule";
import { text as carryText } from "../../../../packages/dragon/src/blocks/carry/gallery/text";
import { shelf as carryShelf } from "../../../../packages/dragon/src/blocks/carry/gallery/shelf";
import { docs as carryDocs } from "../../../../packages/dragon/src/blocks/carry/gallery/docs";
import { rule as carryRule } from "../../../../packages/dragon/src/blocks/carry/gallery/rule";
import { text as edgeLabelText } from "../../../../packages/dragon/src/blocks/edge-label/gallery/text";
import { shelf as edgeLabelShelf } from "../../../../packages/dragon/src/blocks/edge-label/gallery/shelf";
import { docs as edgeLabelDocs } from "../../../../packages/dragon/src/blocks/edge-label/gallery/docs";
import { rule as edgeLabelRule } from "../../../../packages/dragon/src/blocks/edge-label/gallery/rule";
import { text as noteText } from "../../../../packages/dragon/src/blocks/note/gallery/text";
import { shelf as noteShelf } from "../../../../packages/dragon/src/blocks/note/gallery/shelf";
import { docs as noteDocs } from "../../../../packages/dragon/src/blocks/note/gallery/docs";
import { rule as noteRule } from "../../../../packages/dragon/src/blocks/note/gallery/rule";
import { text as sourceText } from "../../../../packages/dragon/src/blocks/source/gallery/text";
import { shelf as sourceShelf } from "../../../../packages/dragon/src/blocks/source/gallery/shelf";
import { docs as sourceDocs } from "../../../../packages/dragon/src/blocks/source/gallery/docs";
import { rule as sourceRule } from "../../../../packages/dragon/src/blocks/source/gallery/rule";
import { text as stripText } from "../../../../packages/dragon/src/blocks/strip/gallery/text";
import { shelf as stripShelf } from "../../../../packages/dragon/src/blocks/strip/gallery/shelf";
import { docs as stripDocs } from "../../../../packages/dragon/src/blocks/strip/gallery/docs";
import { rule as stripRule } from "../../../../packages/dragon/src/blocks/strip/gallery/rule";

/** 見本帳の一覧の名前と説明。鍵はブロックの置き場の dir の名前 */
export const BLOCK_TEXT = {
  "act": actText,
  "carry": carryText,
  "edge-label": edgeLabelText,
  "note": noteText,
  "source": sourceText,
  "strip": stripText,
} as const;

/** 編集画面の棚に置く部品の名前。鍵はブロックの置き場の dir の名前 */
export const BLOCK_SHELF = {
  "act": actShelf,
  "carry": carryShelf,
  "edge-label": edgeLabelShelf,
  "note": noteShelf,
  "source": sourceShelf,
  "strip": stripShelf,
} as const;

/** 使い方の頁の段落。鍵はブロックの置き場の dir の名前 */
export const BLOCK_DOCS = {
  "act": actDocs,
  "carry": carryDocs,
  "edge-label": edgeLabelDocs,
  "note": noteDocs,
  "source": sourceDocs,
  "strip": stripDocs,
} as const;

/** `GRAMMAR.md` の部品と使い方の表の行。鍵はブロックの置き場の dir の名前 */
export const BLOCK_RULE = {
  "act": actRule,
  "carry": carryRule,
  "edge-label": edgeLabelRule,
  "note": noteRule,
  "source": sourceRule,
  "strip": stripRule,
} as const;
