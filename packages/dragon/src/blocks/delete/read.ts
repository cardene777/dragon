/**
 * `delete` のブロックの読み方 (#3632)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { fail } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { branchAt } from "../branch/read";
import type { GitDelete } from "./block";

/** 枝分かれの図の `delete <枝>` の行の枝 */
const DELETE = /^delete\s+([^\s[]+)\s*$/du;

export interface DeleteMessages {
  deleteShape: string;
  /** 消す枝を HEAD が指している */
  deleteHead: (id: string) => string;
  /** 消した枝を、消した後の行に書いた */
  deletedBranch: (id: string) => string;
}

/**
 * 枝分かれの図の `delete <枝>` の行。宣言していない枝と消した枝は枝の確かめ (`branchAt`) が、HEAD が指している枝はここが断る。
 * git も今いる枝は消さないため
 */
function readDelete(source: SourceLine, state: ParseState): GitDelete {
  const { m, figure } = state;
  const found = DELETE.exec(source.text);
  const id = found?.[1];
  if (!found || id === undefined) throw fail(source, 0, m.deleteShape);
  const at = found.indices?.[1]?.[0] ?? 0;
  const branch = branchAt(state, source, id, at);
  if (figure.git.head.on === branch) throw fail(source, at, m.deleteHead(branch));
  figure.git.tips.set(branch, null);
  figure.git.deleted.add(branch);
  return { type: "delete", branch };
}

export const reading: BlockReading<DeleteMessages> = {
  read: {
    delete: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readDelete(source, state));
    },
  },
  print: {
    events: { delete: (e) => `delete ${e.branch}` },
  },
  messages: {
    ja: {
      deleteShape: "枝を消す行は delete <枝> の形で書く",
      deleteHead: (id) => `${id} は HEAD が指している枝なので消せない。先に HEAD を別の枝か commit へ移す`,
      deletedBranch: (id) => `${id} の枝は消したので、もう使えない`,
    },
    en: {
      deleteShape: "Write a branch deletion as delete <branch>",
      deleteHead: (id) => `${id} is the branch HEAD points at, so it cannot be deleted. Move HEAD to another branch or a commit first`,
      deletedBranch: (id) => `Branch ${id} has been deleted and cannot be used any more`,
    },
  },
};
