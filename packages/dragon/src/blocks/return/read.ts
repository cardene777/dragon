/**
 * `return` のブロックの読み方 (#3389)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * 配管の図の呼び出しの行 (`<呼ぶ者> -> <呼ばれる者>: <字> [call: <種類>, value: <量> ETH, fold]`) はこのブロックが線の行の形で読む (`take`)。
 * 配管の図に書けない行 (ほかの種類の図の部品の行) を断り (`checkHead`)、最後まで閉じない呼び出しを、その呼び出しの行を指して止める (`verify`)。
 * 配管の図のブロックが共に使う誤りの文 (開いていない呼び出し、書き込めない呼び出し、槽と量の誤り) もこのブロックが持つ
 */
import { faultAt, inPipeStep, pipeLine, runOf, valueAt } from "../../pipe-read";
import { isAmount, isFault } from "../../pipe-run";
import { attrs } from "../../print-kit";
import { type Attr, fail, isOneOf, readAttrs } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { type BlockReading, type ParseState, ranked } from "../block";
import { CALL_ATTRS, CALL_KINDS, EDGE, ETH, type PipeCall, type PipeCallKind } from "../definition-values";
import { line, readLine } from "../edge/read";
import { BLOCKS } from "../index";

export interface ReturnMessages {
  callShape: string;
  returnShape: string;
  /** `[call: <種類>]` に `delegate` と `static` のほかを書いた */
  callKind: (kind: string) => string;
  /** `[call: create]` は後から足す */
  callCreate: string;
  valueShape: string;
  /** `[fold]` に値を書いた */
  foldBare: string;
  /** 処理を借りる呼び出しに ETH を添えた */
  valueOnDelegate: string;
  /** 書き込めない呼び出しの内側で、残高か値かイベントか ETH を変えた */
  readOnlyCall: string;
  /** `return` と `revert` の者が、いちばん内側で開いている呼び出し (`open` への呼び出し) の呼ばれた者でない */
  notInnermost: (open: string) => string;
  /** 開いている呼び出しが無いのに `return` か `revert` を書いた */
  noOpenCall: string;
  /** `from` から `to` への呼び出しを最後まで閉じない */
  unclosedCall: (from: string, to: string) => string;
  /** `owner` が `token` の槽を持たない */
  noTank: (owner: string, token: string) => string;
  /** `owner` の `token` が `have` しかない */
  short: (owner: string, token: string, have: string) => string;
  /** `move` の頭の者がトークンの Contract でない */
  notTokenContract: string;
  /** 書き替える値を `owner` が持たない */
  noPlate: (owner: string) => string;
  /** 配管の図に、ほかの種類の図の部品の行を書いた */
  pipeNoLine: (word: string) => string;
}

/**
 * 配管の図に書ける行の頭の語。配管の図だけのブロック (`attach.only` が pipe) の語と、関係者と段の行 (#3389)。
 * 図の種類の登録簿から引かずに並べるのは、試す図 (`blocks/route/read.ts`) と同じく、後から読む塊が登録簿を最初に読む script から引き剥がさないため
 */
const PIPE_LINES: readonly string[] = [
  ...ranked(BLOCKS).flatMap((block) => (block.attach.only === "pipe" ? (block.words.heads ?? []) : [])),
  ...["box", "step", "say", "code", "source"],
];

/** 配管の図の呼び出しの行。開いた呼び出しは手順に積み、行を積んで閉じない呼び出しの誤りで名指す */
function readCall(source: SourceLine, state: ParseState): void {
  const { m } = state;
  const edge = EDGE.exec(source.text) as RegExpExecArray;
  const { step, run } = inPipeStep(source, state);
  const text = source.text;
  const { from, to, label, at } = readLine(source, edge, state);
  if (at < text.length && text[at] !== "[") throw fail(source, at, m.callShape);
  const marks = at < text.length ? readAttrs(source, at, CALL_ATTRS, m, ["fold"]) : new Map<string, Attr>();
  const kind = marks.get("call");
  if (kind && kind.value === "create") throw fail(source, valueAt(source, kind), m.callCreate);
  if (kind && !isOneOf(CALL_KINDS, kind.value)) throw fail(source, valueAt(source, kind), m.callKind(kind.value));
  const value = marks.get("value");
  const amount = value ? /^(\S+)\s+ETH$/u.exec(value.value)?.[1] : undefined;
  if (value && (amount === undefined || !isAmount(amount))) throw fail(source, valueAt(source, value), m.valueShape);
  const fold = marks.get("fold");
  if (fold && fold.value !== "") throw fail(source, fold.at, m.foldBare);
  const event: PipeCall = {
    type: "call",
    from,
    to,
    ...(label !== undefined ? { label } : {}),
    ...(amount !== undefined ? { value: amount } : {}),
    ...(kind ? { call: kind.value as PipeCallKind } : {}),
    ...(fold ? { fold: true } : {}),
  };
  const fault = run.call(event);
  if (fault) {
    const mark = value?.at ?? 0;
    const shown = value ? valueAt(source, value) : 0;
    throw faultAt(source, fault, state, { valueOnDelegate: mark, readOnly: mark, noTank: shown, short: shown });
  }
  state.figure.pipe.opened.push(source);
  step.events.push(event);
}

/** `return` と `revert` の行で、いちばん内側の呼び出しを閉じる。`at` は行の者の位置 */
export function closeCall(source: SourceLine, state: ParseState, box: string, at: number, how: "return" | "revert"): void {
  const closed = runOf(state).close(box, how);
  if (isFault(closed)) throw faultAt(source, closed, state, { notOpen: at });
  state.figure.pipe.opened.pop();
}

export const reading: BlockReading<ReturnMessages> = {
  take: (source, state) => {
    readCall(source, state);
    return true;
  },
  // 配管の図は、配管の図で使えるブロックの行だけを書ける
  checkHead: (source, word, state) => {
    if (!PIPE_LINES.includes(word)) throw fail(source, 0, state.m.pipeNoLine(word));
  },
  settle: (state) => {
    runOf(state);
  },
  verify: (state) => {
    const { opened, run } = state.figure.pipe;
    const last = opened[opened.length - 1];
    const frame = run?.frames[run.frames.length - 1];
    if (last && frame) throw fail(last, 0, state.m.unclosedCall(frame.from, frame.to));
  },
  read: {
    return: (source, state) => {
      const { step } = inPipeStep(source, state);
      const { box, at, rest } = pipeLine(source, "return", state, state.m.returnShape, true);
      closeCall(source, state, box, at, "return");
      const value = source.text.slice(rest).trim();
      step.events.push({ type: "return", box, ...(value !== "" ? { value } : {}) });
    },
  },
  print: {
    events: {
      call: (e) => `${line(e.from, e.to, e.label)}${attrs([["call", e.call], ["value", e.value === undefined ? undefined : `${e.value} ${ETH}`]], e.fold ? ["fold"] : [])}`,
      return: (e) => `return ${e.box}${e.value === undefined ? "" : `: ${e.value}`}`,
    },
  },
  messages: {
    ja: {
      callShape: "呼び出しは <呼ぶ者> -> <呼ばれる者>: <字> [<印>] の形で書く",
      returnShape: "return は return <戻る者>: <値> の形で書く",
      callKind: (kind) => `call には delegate か static を書く。${kind} は書けない`,
      callCreate: "call: create はまだ書けない。delegate か static を書く",
      valueShape: "value は value: <量> ETH の形で書く",
      foldBare: "fold は値を持たない。[fold] とだけ書く",
      valueOnDelegate: "[call: delegate] の呼び出しには value を書けない。処理を借りる呼び出しは ETH を送らない",
      readOnlyCall: "[call: static] の呼び出しの内側では、残高と値とイベントと ETH を変えられない",
      notInnermost: (open) => `いちばん内側で開いているのは ${open} への呼び出し。return と revert には ${open} を書く`,
      noOpenCall: "開いている呼び出しが無い。return と revert は呼び出しの行の後ろに書く",
      unclosedCall: (from, to) => `${from} から ${to} への呼び出しが return か revert で閉じていない`,
      noTank: (owner, token) => `${owner} は ${token} の槽を持たない。hold ${owner}: 0 ${token} を書く`,
      short: (owner, token, have) => `${owner} の ${token} は ${have} しかない`,
      notTokenContract: "move の頭にはトークンの Contract を書く。トークンの Contract は hold の量の単位に名前を書いた関係者",
      noPlate: (owner) => `${owner} はこの値を持たない。hold ${owner}: <名前> <値> で宣言する`,
      pipeNoLine: (word) => `pipe (配管の図) には ${word} の行を書けない`,
    },
    en: {
      callShape: "Write a call as <caller> -> <callee>: <text> [<marks>]",
      returnShape: "Write return as return <returner>: <value>",
      callKind: (kind) => `call takes delegate or static, not ${kind}`,
      callCreate: "call: create cannot be written yet. Write delegate or static",
      valueShape: "Write value as value: <amount> ETH",
      foldBare: "fold takes no value. Write just [fold]",
      valueOnDelegate: "A [call: delegate] call takes no value. A call that borrows code sends no ETH",
      readOnlyCall: "Inside a [call: static] call, balances, values, events and ETH cannot change",
      notInnermost: (open) => `The innermost open call is the call to ${open}. Write ${open} on return and revert`,
      noOpenCall: "No call is open. Write return and revert after a call line",
      unclosedCall: (from, to) => `The call from ${from} to ${to} is never closed by return or revert`,
      noTank: (owner, token) => `${owner} has no ${token} tank. Write hold ${owner}: 0 ${token}`,
      short: (owner, token, have) => `${owner} holds only ${have} ${token}`,
      notTokenContract: "Write a token contract at the head of move. A token contract is a party whose name is a unit on a hold line",
      noPlate: (owner) => `${owner} holds no such value. Declare it with hold ${owner}: <name> <value>`,
      pipeNoLine: (word) => `A pipe diagram takes no ${word} lines`,
    },
  },
};
