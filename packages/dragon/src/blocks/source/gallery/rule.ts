/**
 * `docs/design/base/GRAMMAR.md` の部品と使い方の表の、出典の行 (#3345)。
 * 表は図に描く部品の決まりを持ち、図に描かない出典の行は無い
 */
import type { BlockRule } from "../../gallery";

export const rule: BlockRule = { none: "出典は図に描かず読み上げの段の一覧にだけ出るので、GRAMMAR.md の部品と使い方の表に行が無い" };
