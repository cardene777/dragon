/**
 * `docs/design/base/GRAMMAR.md` の部品と使い方の表の、取り消しの行 (#3389)。
 * 表は時系列図と構成図に共通の部品を並べ、配管の図だけの取り消しの行を持たない
 */
import type { BlockRule } from "../../gallery";

export const rule: BlockRule = { none: "GRAMMAR.md の表は共通の部品を並べ、配管の図だけの取り消しの行が無い" };
