// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない
import { shape as actShape } from "./act/shape";
import { shape as askShape } from "./ask/shape";
import { shape as boxShape } from "./box/shape";
import { shape as branchShape } from "./branch/shape";
import { shape as calcShape } from "./calc/shape";
import { shape as callShape } from "./call/shape";
import { shape as carryShape } from "./carry/shape";
import { shape as chainShape } from "./chain/shape";
import { shape as chartItemShape } from "./chart-item/shape";
import { shape as chartSetShape } from "./chart-set/shape";
import { shape as chartShapeShape } from "./chart-shape/shape";
import { shape as checkShape } from "./check/shape";
import { shape as choiceShape } from "./choice/shape";
import { shape as colorShape } from "./color/shape";
import { shape as commitShape } from "./commit/shape";
import { shape as copyShape } from "./copy/shape";
import { shape as edgeShape } from "./edge/shape";
import { shape as edgeLabelShape } from "./edge-label/shape";
import { shape as emitShape } from "./emit/shape";
import { shape as foldShape } from "./fold/shape";
import { shape as gistShape } from "./gist/shape";
import { shape as groupShape } from "./group/shape";
import { shape as holdShape } from "./hold/shape";
import { shape as iconShape } from "./icon/shape";
import { shape as itemShape } from "./item/shape";
import { shape as leafShape } from "./leaf/shape";
import { shape as legendShape } from "./legend/shape";
import { shape as lifelineShape } from "./lifeline/shape";
import { shape as lineShape } from "./line/shape";
import { shape as linkShape } from "./link/shape";
import { shape as logShape } from "./log/shape";
import { shape as mergeShape } from "./merge/shape";
import { shape as nodeShape } from "./node/shape";
import { shape as noteShape } from "./note/shape";
import { shape as orderShape } from "./order/shape";
import { shape as pickShape } from "./pick/shape";
import { shape as pointShape } from "./point/shape";
import { shape as pressShape } from "./press/shape";
import { shape as queueShape } from "./queue/shape";
import { shape as returnShape } from "./return/shape";
import { shape as revertShape } from "./revert/shape";
import { shape as ringShape } from "./ring/shape";
import { shape as roleShape } from "./role/shape";
import { shape as routeShape } from "./route/shape";
import { shape as rowShape } from "./row/shape";
import { shape as scaleShape } from "./scale/shape";
import { shape as sealShape } from "./seal/shape";
import { shape as sideShape } from "./side/shape";
import { shape as sidePathShape } from "./side-path/shape";
import { shape as sourceShape } from "./source/shape";
import { shape as stampShape } from "./stamp/shape";
import { shape as startFinishShape } from "./start-finish/shape";
import { shape as stepShape } from "./step/shape";
import { shape as stripShape } from "./strip/shape";
import { shape as taskShape } from "./task/shape";
import { shape as valueShape } from "./value/shape";
import { shape as writeShape } from "./write/shape";
import { shape as zoomShape } from "./zoom/shape";

/** ブロックの原本の形の欠片の一覧。鍵は置き場の dir の名前。build の時の script と検査だけが読む */
export const SHAPES = {
  "act": actShape,
  "ask": askShape,
  "box": boxShape,
  "branch": branchShape,
  "calc": calcShape,
  "call": callShape,
  "carry": carryShape,
  "chain": chainShape,
  "chart-item": chartItemShape,
  "chart-set": chartSetShape,
  "chart-shape": chartShapeShape,
  "check": checkShape,
  "choice": choiceShape,
  "color": colorShape,
  "commit": commitShape,
  "copy": copyShape,
  "edge": edgeShape,
  "edge-label": edgeLabelShape,
  "emit": emitShape,
  "fold": foldShape,
  "gist": gistShape,
  "group": groupShape,
  "hold": holdShape,
  "icon": iconShape,
  "item": itemShape,
  "leaf": leafShape,
  "legend": legendShape,
  "lifeline": lifelineShape,
  "line": lineShape,
  "link": linkShape,
  "log": logShape,
  "merge": mergeShape,
  "node": nodeShape,
  "note": noteShape,
  "order": orderShape,
  "pick": pickShape,
  "point": pointShape,
  "press": pressShape,
  "queue": queueShape,
  "return": returnShape,
  "revert": revertShape,
  "ring": ringShape,
  "role": roleShape,
  "route": routeShape,
  "row": rowShape,
  "scale": scaleShape,
  "seal": sealShape,
  "side": sideShape,
  "side-path": sidePathShape,
  "source": sourceShape,
  "stamp": stampShape,
  "start-finish": startFinishShape,
  "step": stepShape,
  "strip": stripShape,
  "task": taskShape,
  "value": valueShape,
  "write": writeShape,
  "zoom": zoomShape,
} as const;
