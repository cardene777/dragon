/**
 * commit のブロック (#3164、#3347)。
 *
 * 枝分かれの図の部品 (`only: git`)。段の中の `commit <名札> on <枝> [hash: <hash>, note: <一言>]` の行で枝の先に commit を積み、
 * hash と一言を丸の外に添える。積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。
 * `on <枝>` の後ろの `copy <commit>` (当て直し) と `merge <枝>` (merge commit) は、当て直しのブロックと merge commit のブロックの語で、
 * 同じ行に書くのでこのブロックが一緒に読み書きする。
 * 枝分かれの図では、今いる場所の札の名前 (`HEAD`) を枝と commit と箱の名札に使えない。名札を確かめるのは、図の種類ごとの名札の決まりを知る parser が行う。
 */
import { attrs } from "../../print-kit";
import { type Attr, fail, HASH, ID, readAttrs, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type Block, type ParseState } from "../block";
import { branchAt } from "../branch/block";
import { COPY } from "../copy/block";
import { MERGE, mergedAt } from "../merge/block";

/** 枝分かれの図の `commit` の行で、積む枝を続ける語 (`commit <名札> on <枝>`) */
export const ON = "on";
/** 枝分かれの図で今いる場所を指す札の名前。枝と commit と箱の名札に使えない */
export const HEAD = "HEAD";

/**
 * 枝分かれの図の commit を積む出来事。積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。
 * 当て直し (`copy`) は枝の札を動かさず、merge commit (`merge`) は取り込む枝の先端も親に持つ
 */
export interface GitCommit {
  type: "commit";
  id: string;
  branch: string;
  copy?: string;
  merge?: string;
  hash?: string;
  note?: string;
}

/** 枝分かれの図の `commit` の行。名札と、`on` の枝と、`copy` の当て直しの元と、`merge` の取り込む枝 */
const COMMIT = new RegExp(`^commit\\s+([^\\s[]+)(?:\\s+${ON}\\s+([^\\s[]+))?(?:\\s+${COPY}\\s+([^\\s[]+))?(?:\\s+${MERGE}\\s+([^\\s[]+))?`, "du");

export interface CommitMessages {
  commitShape: string;
  noCommit: (id: string) => string;
  /** 札を動かす線の送る側が、枝の名札でも HEAD でもない */
  undeclaredRef: (id: string) => string;
  /** 枝分かれの図で、今いる場所の札の名前 (`name`) を名札にした */
  headReserved: (name: string) => string;
}

/** 積んだ commit の名札 `id` をそのまま返す。まだ積んでいない commit は、名札の列 `at` を示して誤りで止める */
export const commitAt = (state: ParseState, source: SourceLine, id: string, at: number): string => {
  if (!state.figure.git.commits.has(id)) throw fail(source, at, state.m.noCommit(id));
  return id;
};

/**
 * 枝分かれの図の `commit <名札> on <枝> [copy <commit>] [merge <枝>] [hash: <hash>, note: <一言>]` の行。
 * 積んだ枝の札は新しい commit へ進む。当て直しは枝の札を動かさない
 */
function readCommit(source: SourceLine, state: ParseState): GitCommit {
  const { m, figure } = state;
  const text = source.text;
  const found = COMMIT.exec(text);
  const at = (k: number): number => found?.indices?.[k]?.[0] ?? 0;
  const id = found?.[1];
  const on = found?.[2];
  if (!found || id === undefined || on === undefined) throw fail(source, 0, m.commitShape);
  const rest = skipSpaces(text, found[0].length);
  if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.commitShape);
  if (!ID.test(id)) throw fail(source, at(1), m.badId(id));
  state.claim(source, id, at(1));
  const branch = branchAt(state, source, on, at(2));
  const copy = found[3] === undefined ? undefined : commitAt(state, source, found[3], at(3));
  const merge = found[4] === undefined ? undefined : mergedAt(state, source, found[4], at(4), branch);
  const attrs = rest < text.length ? readAttrs(source, rest, state.attrs.commit ?? [], m) : new Map<string, Attr>();
  const hash = attrs.get("hash");
  if (hash && !HASH.test(hash.value)) throw fail(source, hash.at, m.badHash);
  const note = attrs.get("note")?.value;
  figure.git.commits.add(id);
  if (copy === undefined) figure.git.tips.set(branch, id);
  return {
    type: "commit",
    id,
    branch,
    ...(copy !== undefined ? { copy } : {}),
    ...(merge !== undefined ? { merge } : {}),
    ...(hash ? { hash: hash.value } : {}),
    ...(note !== undefined ? { note } : {}),
  };
}

export const block: Block<CommitMessages> = {
  name: "commit",
  rank: 6,
  attach: { how: "place", only: "git" },
  // 行の頭の語の一覧では、枝の語の後ろ、時間軸の図のブロックの語 (順 90 から) の前に並ぶ
  words: { heads: ["commit"], headRanks: { commit: 89 }, attrs: { commit: ["hash", "note"] } },
  read: {
    commit: (source, state) => {
      const step = state.inStep(source);
      step.events.push(readCommit(source, state));
    },
  },
  print: {
    events: {
      commit: (e) =>
        `commit ${e.id} ${ON} ${e.branch}${e.copy === undefined ? "" : ` ${COPY} ${e.copy}`}${e.merge === undefined ? "" : ` ${MERGE} ${e.merge}`}${attrs([
          ["hash", e.hash],
          ["note", e.note],
        ])}`,
    },
  },
  messages: {
    ja: {
      commitShape: "commit は commit <名札> on <枝> [hash: <hash>, note: <一言>] の形で書く。当て直しは copy <commit> を、取り込みは merge <枝> を on <枝> の後ろに書く",
      noCommit: (id) => `${id} という commit はまだ積んでいない`,
      undeclaredRef: (id) => `${id} という枝は宣言していない。札を動かす線は枝の名札か HEAD から引く`,
      headReserved: (name) => `${name} は枝分かれの図で今いる場所の札の名前で、名札に使えない`,
    },
    en: {
      commitShape:
        "Write a commit as commit <id> on <branch> [hash: <hash>, note: <note>]. For a replayed commit add copy <commit>, and for a merge commit add merge <branch>, after on <branch>",
      noCommit: (id) => `No commit named ${id} has been made yet`,
      undeclaredRef: (id) => `No branch named ${id} is declared. A line that moves a ref starts from a branch id or HEAD`,
      headReserved: (name) => `${name} names where you are in a git diagram and cannot be an id`,
    },
  },
};
