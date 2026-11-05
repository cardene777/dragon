/**
 * 配管の図 (#3389) のブロックの読む処理が共に使う下請け。
 *
 * 配管の図の行は `<頭の語> <者>: <続き>` の形をそろえて持つので、者と続きの位置を読む処理 (`pipeLine`) をここに置く。
 * 段の中の出来事は、呼び出しの管のブロックが最初の段を始める時に作る手順 (`PipeRun`) に当て、当てられなかった訳を行の誤りにする (`faultAt`)。
 * 槽、値の札、確認、イベント、換算、取り消し、呼び出しの管の 7 つのブロックが読み、どれか 1 つのブロックに置くと読み合いの輪になるので、ここに置く。
 * 訳の誤りの文は、配管の図なら必ず読む呼び出しの管のブロック (`return`) が持つ。
 */
import type { ParseState, StepDraft } from "./blocks/block";
import { isAmount, type PipeFault, PipeRun } from "./pipe-run";
import { type Attr, fail, type NotationError, readQuoted, skipSpaces } from "./read-kit";
import type { SourceLine } from "./tokenize";

/** 行の者と、`:` の後ろの続き。`at` は者の位置、`rest` は続きの始まりの位置 (続きが無ければ行の終わり) */
export interface PipeLine {
  box: string;
  at: number;
  rest: number;
}

/**
 * `<頭の語> <者>: <続き>` の行の者と続きの位置。者は宣言した関係者で、宣言していない者は者の位置を指して止める。
 * `bare` を立てた行 (`return` と `revert`) は `:` と続きを省ける。形に合わない行は `shape` の文で止める
 */
export function pipeLine(source: SourceLine, word: string, state: ParseState, shape: string, bare = false): PipeLine {
  const found = new RegExp(`^${word}\\s+([^\\s:[]+)\\s*(:|$)`, "du").exec(source.text);
  const id = found?.[1];
  const at = found?.indices?.[1]?.[0];
  if (!found || id === undefined || at === undefined || (found[2] === "" && !bare)) throw fail(source, 0, shape);
  const box = state.boxAt(source, id, at);
  return { box, at, rest: found[2] === "" ? source.text.length : skipSpaces(source.text, found[0].length) };
}

/** 段の中に書く行の書き先の段と、出来事を当てる手順。手順は最初の段を始める時に作る */
export function inPipeStep(source: SourceLine, state: ParseState): { step: StepDraft; run: PipeRun } {
  const step = state.inStep(source);
  return { step, run: runOf(state) };
}

/** 出来事を当てる手順。全ての宣言を読んだ後に、宣言した関係者と始めの値から作る */
export function runOf(state: ParseState): PipeRun {
  const pipe = state.figure.pipe;
  pipe.run ??= new PipeRun(state.figure.boxes, pipe.holds);
  return pipe.run;
}

/**
 * 値の名前 (`hold` と `write` の名前) を `at` から読む。`"` で始まれば囲みの中、そうでなければ空白の前まで。
 * `end` は名前の後ろの位置。名前が無ければ `undefined`
 */
export function readValueName(source: SourceLine, at: number, state: ParseState): { name: string; end: number } | undefined {
  const text = source.text;
  if (text[at] === '"') {
    const quoted = readQuoted(source, at, state.m);
    return { name: quoted.value, end: quoted.end };
  }
  const name = /^\S+/u.exec(text.slice(at))?.[0];
  return name === undefined ? undefined : { name, end: at + name.length };
}

/** 値の名前を書き戻す。空白か `"` か `[` か `,` を含む名前と、量として読める名前は `"` で囲む */
export function valueName(name: string): string {
  return /[\s"[\],]/u.test(name) || isAmount(name) ? `"${name.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"')}"` : name;
}

/** 属性 `attr` の値の位置。値が見つからなければ鍵の位置 */
export function valueAt(source: SourceLine, attr: Attr): number {
  const at = source.text.indexOf(attr.value, attr.at + 1);
  return attr.value === "" || at < 0 ? attr.at : at;
}

/** 字 `part` の位置。`from` より後ろで探し、見つからなければ `from` */
export function textAt(source: SourceLine, part: string, from: number): number {
  const at = source.text.indexOf(part, from);
  return at < 0 ? from : at;
}

/**
 * 出来事を当てられなかった訳を、行の誤りにする。`at` は訳ごとの指す位置で、書いていない訳は行の頭を指す。
 * 誤りの文は呼び出しの管のブロックが持つ
 */
export function faultAt(source: SourceLine, fault: PipeFault, state: ParseState, at: Partial<Record<PipeFault["fault"], number>>): NotationError {
  const { m } = state;
  const where = at[fault.fault] ?? 0;
  switch (fault.fault) {
    case "notOpen":
      return fail(source, where, fault.open ? m.notInnermost(fault.open.to) : m.noOpenCall);
    case "readOnly":
      return fail(source, where, m.readOnlyCall);
    case "valueOnDelegate":
      return fail(source, where, m.valueOnDelegate);
    case "noTank":
      return fail(source, where, m.noTank(fault.owner, fault.token));
    case "short":
      return fail(source, where, m.short(fault.owner, fault.token, fault.have));
    case "notToken":
      return fail(source, where, m.notTokenContract);
    case "noPlate":
      return fail(source, where, m.noPlate(fault.owner));
  }
}
