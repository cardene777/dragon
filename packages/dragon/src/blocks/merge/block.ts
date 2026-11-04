/**
 * merge commit のブロック (#3164、#3347)。
 *
 * 枝分かれの図の接続ブロック (`only: git`)。`commit <名札> on <枝>` の後ろに `merge <枝>` を書くと、取り込む先の先端と取り込む枝の先端の 2 つを親に持つ commit になり、
 * 取り込む枝の先端から merge commit へ線を引いて 2 つの commit を結ぶ。取り込む先の札だけが進む。
 * `merge` の語は commit の行の中に書くので行の頭の語を持たず、commit の行は commit のブロックが読み書きする。
 * 取り込む枝を確かめる処理 (`mergedAt`) と誤りの文はこのブロックが持ち、commit のブロックが呼ぶ。
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type Block, none, type ParseState } from "../block";
import { branchAt } from "../branch/block";

/** 枝分かれの図の `commit` の行で、取り込む枝を続ける語 (`commit <名札> on <枝> merge <枝>`) */
export const MERGE = "merge";

export interface MergeMessages {
  /** 取り込む枝が、まだどの commit も指していない */
  emptyBranch: (id: string) => string;
  mergeSelf: (id: string) => string;
}

/** merge commit が取り込む枝。積む枝 `into` と別の、もう commit を指している枝 */
export function mergedAt(state: ParseState, source: SourceLine, id: string, at: number, into: string): string {
  branchAt(state, source, id, at);
  if (id === into) throw fail(source, at, state.m.mergeSelf(id));
  if (state.figure.git.tips.get(id) === null) throw fail(source, at, state.m.emptyBranch(id));
  return id;
}

export const block: Block<MergeMessages> = {
  name: "merge",
  rank: 8,
  attach: { how: "connect", only: "git" },
  words: {},
  read: none("merge の語は commit の行の中に書くので、commit のブロックが commit の行と一緒に読み、取り込む枝を mergedAt で確かめる"),
  print: none("merge の語は commit の行の中に書くので、commit のブロックが commit の行と一緒に書く"),
  messages: {
    ja: {
      emptyBranch: (id) => `${id} の枝はまだどの commit も指していないので取り込めない`,
      mergeSelf: (id) => `${id} は積む枝なので、取り込む枝にできない`,
    },
    en: {
      emptyBranch: (id) => `Branch ${id} does not point at any commit yet, so it cannot be merged`,
      mergeSelf: (id) => `${id} is the branch being committed to, so it cannot be the branch merged in`,
    },
  },
};
