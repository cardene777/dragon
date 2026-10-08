import { CLASS_RELATION_LOOK } from "@cardenelabs/cdl";
import type { CdlDiagram, CdlEdge, ClassRelationType, Tone } from "@cardenelabs/cdl";
import type { DslDocument, DslStep } from "../types";

import { ERの関係の指定を作る, ERの関係の矢印 } from "./er-relation";
import { compileGenericWithAnimate } from "./generic";

/** UML の関係を、印の形と同じ 3 群の色へ寄せる。描画側の classDiagram と同じ決まり。 */
const クラスの関係の色: Record<ClassRelationType, Tone> = {
  extends: "accent",
  implements: "accent",
  aggregates: "teal",
  composes: "teal",
  associates: "success",
  uses: "success",
};

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
  return compileGenericWithAnimate(doc, {
    kind: "record",
    laneWidth: 縦列の幅(doc),
    edgeDefaults: 関係の既定,
  });
}

/**
 * record の関係の既定 (#2783)。
 *
 * `relation` がある時だけ UML の関係として読み、`sub` は行き先、`tailSub` は出どころの
 * 多重度にする。 relation の無い `sub` は従来どおり線の名前の下の行として残す。
 * relation の有無を境にすることで、既存の record の補足を壊さず、class から移した本文も
 * 同じ欄のまま同じ端へ置ける。
 */
function 関係の既定(s: DslStep): Partial<CdlEdge> {
  if (s.relation === undefined) {
    return ERの関係の矢印(ERの関係の指定を作る(s));
  }

  const 見た目 = CLASS_RELATION_LOOK[s.relation];
  return {
    label: s.label,
    tone: クラスの関係の色[s.relation],
    style: 見た目.style,
    head: 見た目.head,
    headFill: 見た目.fill,
    tailHead: 見た目.tailHead,
    tailHeadFill: 見た目.tailFill,
    ...(s.sub !== undefined ? { headLabel: s.sub } : {}),
    ...(s.tailSub !== undefined ? { tailLabel: s.tailSub } : {}),
  };
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
