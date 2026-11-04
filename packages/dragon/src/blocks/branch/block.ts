/**
 * 枝のブロック (#3164、#3347)。
 *
 * 枝分かれの図の部品 (`only: git`)。最初の `step` より前に `branch <名札> [note: <添え書き>]` で枝を上から順に宣言し、枝ごとに横長の帯が並ぶ。
 * 段の中で `<枝> from <commit>` と書くと、その commit から枝を切る。枝を切る行は行の頭が枝の名札なので、
 * parser が宣言した枝の名札の次に `from` が来る行を見分けて `readCut` を呼ぶ。
 * 書き戻す時は、枝の行を図の種類の行の直ぐ後ろ (箱の宣言より前) に書く。
 */
import { attrs } from "../../print-kit";
import { fail, readDeclared } from "../../read-kit";
import type { DiagramEvent } from "../../schema";
import type { SourceLine } from "../../tokenize";
import { type Block, type ParseState } from "../block";

/** 枝分かれの図で枝を切る行の、枝の後ろに切る commit を続ける語 (`<枝> from <commit>`) */
export const FROM = "from";

/** 枝分かれの図の枝。上から宣言した順に帯を並べる */
export interface GitBranch {
  id: string;
  note?: string;
}

/** 枝を切る出来事。枝の札を `from` の commit へ置く */
export type BranchCut = Extract<DiagramEvent, { type: "branch" }>;

/** 枝分かれの図の、枝を切る行。枝と `from` と切る commit */
const CUT = new RegExp(`^([^\\s[]+)\\s+${FROM}(?:\\s+([^\\s[]+))?\\s*$`, "du");

export interface BranchMessages {
  /** 枝分かれの図だけの行 (`branch` と `commit`) を、別の種類の図に書いた (#3164) */
  gitOnly: (word: string) => string;
  noBranches: string;
  branchShape: string;
  fromShape: string;
  undeclaredBranch: (id: string) => string;
}

/** 宣言した枝の名札 `id` をそのまま返す。宣言していない枝は、名札の列 `at` を示して誤りで止める */
export const branchAt = (state: ParseState, source: SourceLine, id: string, at: number): string => {
  if (!state.figure.git.tips.has(id)) throw fail(source, at, state.m.undeclaredBranch(id));
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
  step.events.push({ type: "branch", branch, from });
}

export const block: Block<BranchMessages> = {
  name: "branch",
  rank: 5,
  attach: { how: "place", only: "git" },
  // 行の頭の語の一覧では、移していない時間軸の図の語の前に並ぶ
  words: { heads: ["branch"], headRanks: { branch: 89 }, attrs: { branch: ["note"] } },
  shape: {
    field: { type: "array", minItems: 1, items: { $ref: "#/definitions/branch" } },
    definitions: {
      branch: {
        description: "枝。帯の左に名札と添え書きを置く",
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: { $ref: "#/definitions/id" },
          note: { $ref: "#/definitions/text" },
        },
      },
    },
    events: {
      branch: {
        description: "枝を切る。枝分かれの図だけが書ける。枝の札を from の commit へ置き、HEAD をその枝へ移す",
        type: "object",
        additionalProperties: false,
        required: ["type", "branch", "from"],
        properties: {
          type: { const: "branch" },
          branch: { $ref: "#/definitions/id" },
          from: { $ref: "#/definitions/id" },
        },
      },
    },
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
      gitOnly: (word) => `${word} の行は git (枝分かれの図) でだけ書ける`,
      noBranches: "branch の行で枝を 1 つ以上宣言する",
      branchShape: "branch は branch <名札> [note: <添え書き>] の形で書く",
      fromShape: "枝を切る行は <枝> from <commit> の形で書く",
      undeclaredBranch: (id) => `${id} という枝は宣言していない`,
    },
    en: {
      gitOnly: (word) => `${word} lines can be written only in git diagrams`,
      noBranches: "Declare at least one branch with a branch line",
      branchShape: "Write a branch as branch <id> [note: <note>]",
      fromShape: "Write a branch cut as <branch> from <commit>",
      undeclaredBranch: (id) => `No branch named ${id} is declared`,
    },
  },
};
