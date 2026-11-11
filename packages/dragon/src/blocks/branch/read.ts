/**
 * `branch` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs } from "../../print-kit";
import { fail, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { FROM } from "./block";
import { HEAD } from "../commit/block";

/** 枝分かれの図の、枝を切る行。枝と `from` と切る commit */
const CUT = new RegExp(`^([^\\s[]+)\\s+${FROM}(?:\\s+([^\\s[]+))?\\s*$`, "du");

export interface BranchMessages {
  noBranches: string;
  branchShape: string;
  fromShape: string;
  undeclaredBranch: (id: string) => string;
}

/** 宣言した枝の名札 `id` をそのまま返す。宣言していない枝と消した枝 (#3632) は、名札の列 `at` を示して誤りで止める */
export const branchAt = (state: ParseState, source: SourceLine, id: string, at: number): string => {
  if (!state.figure.git.tips.has(id)) throw fail(source, at, state.m.undeclaredBranch(id));
  if (state.figure.git.deleted.has(id)) throw fail(source, at, state.m.deletedBranch(id));
  return id;
};

/** 枝分かれの図で、行の頭の語 `word` が宣言した枝の名札で、次の語 `second` が `from` の行か。枝を切る行 */
export const isCut = (state: ParseState, word: string, second: string | undefined): boolean => state.kind === "git" && state.figure.git.tips.has(word) && second === FROM;

/** 枝分かれの図の `<枝> from <commit>` の行。段の中に書き、枝の札を commit へ置く */
export function readCut(source: SourceLine, state: ParseState): void {
  const { m, figure } = state;
  const step = state.inStep(source);
  const found = CUT.exec(source.text);
  const branch = found?.[1];
  const from = found?.[2];
  if (!found || branch === undefined || from === undefined) throw fail(source, 0, m.fromShape);
  if (!figure.git.commits.has(from)) throw fail(source, found.indices?.[2]?.[0] ?? 0, m.noCommit(from));
  figure.git.tips.set(branch, from);
  // 枝を切ると HEAD はその枝へ移る
  figure.git.head = { at: from, on: branch };
  step.events.push({ type: "branch", branch, from });
}

export const reading: BlockReading<BranchMessages> = {
  // 枝を切る行 (`<枝> from <commit>`) は行の頭の語を持たないので、行の形で読む。宣言した枝の名札で始まる行だけを読む
  take: (source, state, view) => {
    if (!isCut(state, view.word, view.second)) return false;
    readCut(source, state);
    return true;
  },
  // 線は、送る側の枝の札を受ける側の commit へ動かす。HEAD を動かす線は HEAD を枝から離し、
  // 枝から離れた HEAD が指す commit へ枝の札が来ると HEAD はその枝に戻る (#3632)
  afterEdge: (edge, state) => {
    const { git } = state.figure;
    if (edge.from === HEAD) {
      git.head = { at: edge.to, on: null };
      return;
    }
    git.tips.set(edge.from, edge.to);
    if (git.head.on === edge.from) git.head.at = edge.to;
    else if (git.head.on === null && git.head.at === edge.to) git.head.on = edge.from;
  },
  finish: (state, head) => {
    if (state.figure.branches.length === 0) throw fail(head, 0, state.m.noBranches);
  },
  read: {
    // 枝は宣言した順に上から帯に並ぶ。宣言した枝はまだどの commit も指さない
    branch: (source, state) => {
      const { m, figure } = state;
      state.beforeSteps(source);
      const declared = readDeclared(source, "branch", state.attrs.branch ?? [], m);
      if (declared.name !== undefined) throw fail(source, 0, m.branchShape);
      state.claim(source, declared.id, declared.idAt);
      const note = declared.attrs.get("note")?.value;
      figure.branches.push({ id: declared.id, ...(note !== undefined ? { note } : {}) });
      figure.git.tips.set(declared.id, null);
    },
  },
  print: {
    declare: (diagram) => {
      const lines = (diagram.git?.branches ?? []).map((b) => `branch ${b.id}${attrs([["note", b.note]])}`);
      return lines.length > 0 ? [lines.join("\n")] : [];
    },
    events: { branch: (e) => `${e.branch} ${FROM} ${e.from}` },
  },
  messages: {
    ja: {
      noBranches: "branch の行で枝を 1 つ以上宣言する",
      branchShape: "branch は branch <名札> [note: <添え書き>] の形で書く",
      fromShape: "枝を切る行は <枝> from <commit> の形で書く",
      undeclaredBranch: (id) => `${id} という枝は宣言していない`,
    },
    en: {
      noBranches: "Declare at least one branch with a branch line",
      branchShape: "Write a branch as branch <id> [note: <note>]",
      fromShape: "Write a branch cut as <branch> from <commit>",
      undeclaredBranch: (id) => `No branch named ${id} is declared`,
    },
  },
};
