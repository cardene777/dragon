/** `docs/design/base/GRAMMAR.md` の部品と使い方の表の、箱の行と今の箱の行 (#3345) */
import type { BlockRule } from "../../gallery";

export const rule: BlockRule = [
  { part: "箱", rule: "登場する物は全て高さ 72 の箱。印、名前、下の小さな字の 3 段", name: "`E.card`" },
  { part: "今の箱", rule: "縁に色、外に淡い光。下の小さな字が、その時に起きていることへ書き換わる", name: "`E.card` の `on` と `swap`" },
];
