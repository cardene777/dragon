/**
 * `merge` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, none, type ParseState } from "../block";
import { branchAt } from "../branch/read";

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

export const reading: BlockReading<MergeMessages> = {
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
