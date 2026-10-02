import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";

import { compileGenericWithAnimate } from "./generic";

/**
 * 箱が行を持つ図の組み立て (#2782)。
 *
 * 畳む前は `er` と `state` の 2 つに分かれており、それぞれが **2 つの経路** を持っていた。
 * 動きか縦列 (表の図) か種類 (移り変わりの図) を書いた図は共通の経路へ、書かない図は
 * 組み立て器 (`er()` / `stateMachine()`) の経路へ落ちていた。
 *
 * **経路は共通の 1 本だけにする**。 組み立て器の経路は書いた行を捨てており
 * (`rows: []` を渡していた)、記法に行を書いても図に出なかった。 動きを 1 段足すだけで
 * 行が現れる形になっていたので、同じ記法が同じ図になるほうへ倒す。
 */
export function compileRecord(doc: DslDocument): CdlDiagram {
  return compileGenericWithAnimate(doc, { kind: "record", laneWidth: 縦列の幅(doc) });
}

/**
 * 縦列の幅 (#2782)。
 *
 * **行を持つ箱があるかで決める**。 行を持つ箱は名前と型が左右に分かれて並ぶので幅が要り、
 * 持たない箱は題だけなので要らない。 畳む前は図種ごとに持っていた値 (表の図 450 /
 * 移り変わりの図 360) で、どちらも「行を持つか」 の言い換えだった。
 *
 * 書いた `lanes:` の幅はこの既定より強い (`compile/lanes.ts` が後から重ねる)。
 */
function 縦列の幅(doc: DslDocument): number {
  return doc.actors.some((a) => (a.rows?.length ?? 0) > 0) ? 450 : 360;
}
