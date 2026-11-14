/**
 * `commit` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs } from "../../print-kit";
import { type Attr, fail, HASH, ID, readAttrs, skipSpaces } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState } from "../block";
import { branchAt } from "../branch/read";
import { COPY, type GitCommit, HEAD, MERGE, ON } from "../definition-values";
import { mergedAt } from "../merge/read";

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
  // HEAD は積んだ枝を指していれば新しい commit へ進み、当て直しでは枝から離れていれば付いていく。最初の commit を積んだ枝を HEAD が指す (#3632)
  const { head } = figure.git;
  const first = head.at === null && head.on === null;
  if (copy === undefined) {
    figure.git.tips.set(branch, id);
    if (head.on === branch) head.at = id;
  } else if (head.on === null) head.at = id;
  if (first) figure.git.head = { at: id, on: branch };
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

export const reading: BlockReading<CommitMessages> = {
  // 線の送る側は枝の名札か `HEAD`、受ける側は積んだ commit
  endAt: (source, id, at, side, state) => {
    if (side === "to") return commitAt(state, source, id, at);
    if (id !== HEAD && !state.figure.git.tips.has(id)) throw fail(source, at, state.m.undeclaredRef(id));
    return id;
  },
  reserved: (source, id, at, state) => {
    if (id === HEAD) throw fail(source, at, state.m.headReserved(id));
  },
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
