import type { DslActor } from "../types";
/**
 * 箱に出す題を決める (#2030 で `compile.ts` から移した)。
 *
 * 15 図種の組み立て器が使う。 `compileC4` だけは自前で題を組む。
 */

/** 題を出さない種類。 始まりと終わりの印は丸だけを描き、中に字を入れない */
const 題を持たない種類: ReadonlySet<string> = new Set(["mark-start", "mark-end"]);

/**
 * 箱に出す題 (#1381)。 書いていなければ名前をそのまま使う。
 *
 * 名前は図の中で 1 つに決まる必要がある (`focus:` と `flow:` が名前で指す) 一方、題は
 * 重なってよい。 同じ題の箱を並べる図と、題を持たない箱は、名前と切り離さないと書けない。
 *
 * **始まりと終わりの印は題を持たない** (#1466)。 塗った丸と輪で描くもので、名前を出す場所が
 * 無い。 名前は矢印の端として指すために要るので、名前をそのまま題にすると `begin` の字が
 * 丸の上に乗る (組み立て API 側の `.mark()` は題を空で作る)。 書いた題があればそれを使う。
 */
export function 箱の題(a: DslActor): string {
  if (a.title === undefined && a.kind !== undefined && 題を持たない種類.has(a.kind)) return "";
  return a.title ?? a.name;
}
