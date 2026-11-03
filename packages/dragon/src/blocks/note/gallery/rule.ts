/**
 * `docs/design/base/GRAMMAR.md` の部品と使い方の表の、箱の下の小さな字の行 (#3345)。
 * 表は下の字を、箱の 3 段の 1 つ (`箱` の行) と、今の箱の字の書き換え (`今の箱` の行) として書く
 */
import type { BlockRule } from "../../gallery";

export const rule: BlockRule = { none: "GRAMMAR.md の表は下の字を箱の行と今の箱の行の中で書き、下の字だけの行が無い。2 つの行は箱を描く決まりなので箱が持つ" };
