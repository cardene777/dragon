/**
 * `docs/design/base/GRAMMAR.md` の部品と使い方の表の、通らない道の行 (#3347)。
 * 表は時系列図と構成図に共通の部品を並べ、状態遷移図だけの通らない道の行を持たない
 */
import type { BlockRule } from "../../gallery";

export const rule: BlockRule = { none: "GRAMMAR.md の表は共通の部品を並べ、状態遷移図だけの通らない道の行が無い" };
