import type { DslActor } from "../types";
/**
 * 箱に出す題を決める (#2030 で `compile.ts` から移した)。
 *
 * 15 図種の組み立て器が使う。 `compileC4` だけは自前で題を組む。
 */

/** 題を出さない種類。 始まりと終わりの印は丸だけを描き、中に字を入れない */
const 題を持たない種類: ReadonlySet<string> = new Set(["mark-start", "mark-end"]);

/** 箱に出す題。 題を書いていなければ名前を使う */
export function 箱の題(a: DslActor): string {
  if (a.title === undefined && a.kind !== undefined && 題を持たない種類.has(a.kind)) return "";
  return a.title ?? a.name;
}
