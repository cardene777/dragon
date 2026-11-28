/**
 * 試す図 (#3337) の部品のブロックの読む処理が共に使う下請け (#3348)。
 *
 * 部品を名指す属性と欄を名指す鍵は、全ての宣言を読んでから確かめる (`refer` と `fieldAt` を `figure.try.pending` に積む)。
 * 最初の段を始める時か記法の終わりに積んだ確かめを 1 度だけ回し、段の中の出来事を当てる状態 (`TryRun`) を作る (`settleTry`)。
 * 段の中の出来事を当てられなかった訳は、行の誤りにする (`faultOf`)。
 * 網、待ち行列、機械の列、記録の列、入力の帯、釦のブロックが読み、どれか 1 つのブロックに置くと別のブロックとの間で読み合いの輪になるので、ここに置く。
 * 誤りの文は各ブロックが持つ。
 * 種類の行に `[shape: scenes]` を書いた図 (#3873) は、積んだ確かめの後に場面の図として描けるか (`settleScenes`) を確かめる。
 */
import type { ParseState } from "./blocks/block";
import { type Attr, fail, type NotationError, readQuoted, skipSpaces } from "./read-kit";
import type { TryPart } from "./schema";
import type { SourceLine } from "./tokenize";
import { askFields, type TryFault, TryRun } from "./try-state";

/** 属性 `attr` の値の位置。値が見つからなければ鍵の位置 */
export function valueAt(source: SourceLine, attr: Attr): number {
  const at = source.text.indexOf(attr.value, attr.at);
  return at < 0 ? attr.at : at;
}

/** 属性 `attr` が名指す部品が、種類 `want` のどれかの部品か。全ての宣言を読んでから確かめる */
export function refer(source: SourceLine, attr: Attr, want: readonly TryPart["type"][], state: ParseState): void {
  const { m } = state;
  const { parts, pending } = state.figure.try;
  pending.push(() => {
    const part = parts.find((p) => p.id === attr.value);
    if (!part) throw fail(source, valueAt(source, attr), m.undeclaredPart(attr.value));
    if (!want.includes(part.type)) throw fail(source, valueAt(source, attr), m.wrongPart(attr.value, want));
  });
}

/** `field` が入力の帯の欄 (最初の欄を除く) か。`at` は誤りを出す位置 */
export function fieldAt(source: SourceLine, field: string, at: number, state: ParseState): void {
  const { m } = state;
  const fields = askFields(state.figure.try.parts).slice(1);
  if (fields.length === 0) throw fail(source, at, m.noAsk);
  if (!fields.includes(field)) throw fail(source, at, m.notAskField(field, fields));
}

/** 部品の行に要る属性。無ければ行の終わりか属性の `[` を示して断る */
export function needed(source: SourceLine, attrs: Map<string, Attr>, word: string, key: string, at: number, state: ParseState): Attr {
  const attr = attrs.get(key);
  if (!attr) throw fail(source, at, state.m.needsAttr(word, key));
  return attr;
}

/** 種類の行に `[shape: scenes]` を書いた選べる図か (#3873) */
export const scenesShape = (state: ParseState): boolean => state.kind === "try" && state.head.get("shape")?.value === "scenes";

/** 場面の図 (#3873) の行を覚える。全ての宣言を読んでから確かめる誤りが、鍵 (`ask`、`choose:<欄>`、`item:<名札>`) で行を名指す */
export function keepLine(state: ParseState, key: string, source: SourceLine): void {
  const spec = state.figure.try;
  spec.lines ??= new Map();
  spec.lines.set(key, source);
}

/** 行の中の語 `word` の位置。見つからなければ行の頭 */
const at = (source: SourceLine, word: string): number => Math.max(0, source.text.indexOf(word));

/**
 * 場面の図 (#3873) として描けるかを、全ての宣言を読んでから確かめる。入力の帯が在り、場面の欄が選択肢を持ち、
 * やり取りの `item` は場面と送り手と受け手と中身を全て書き、答えの `item` は場面と中身だけを書く。送り手と受け手は網の道の節で、
 * 場面ごとにやり取りを 1 つ以上と答えを 1 つだけ持つ
 */
function settleScenes(state: ParseState, head: SourceLine): void {
  const { m } = state;
  const { parts, items, lines } = state.figure.try;
  const ask = parts.find((p): p is Extract<TryPart, { type: "ask" }> => p.type === "ask");
  const askLine = lines?.get("ask");
  if (!ask || !askLine) throw fail(head, 0, m.scenesNoAsk);
  const [, field = "", from = "", to = "", body = ""] = ask.fields;
  const scenes = ask.choices?.[field];
  if (!scenes) throw fail(askLine, at(askLine, `, ${field}`) + 2, m.scenesNoChoices(field));
  const route = parts.find((p): p is Extract<TryPart, { type: "route" }> => p.type === "route");
  const lanes = route?.paths[0] ?? [];
  const rows = new Map<string, number>();
  const answers = new Map<string, string[]>();
  for (const item of items) {
    const line = lines?.get(`item:${item.id}`) ?? head;
    const v = item.values;
    const scene = v[field];
    const a = v[from];
    const b = v[to];
    const answer = a === undefined && b === undefined;
    if (scene === undefined || v[body] === undefined || (!answer && (a === undefined || b === undefined)))
      throw fail(line, at(line, item.id), m.scenesItemFields(item.id, [field, from, to, body]));
    if (answer) {
      const ids = [...(answers.get(scene) ?? []), item.id];
      if (ids.length > 1) throw fail(line, at(line, item.id), m.scenesAnswers(scene, ids));
      answers.set(scene, ids);
      continue;
    }
    for (const lane of [a, b] as string[])
      if (!lanes.includes(lane)) throw fail(line, at(line, `: ${lane}`) + 2, m.scenesItemLane(item.id, lane, lanes));
    rows.set(scene, (rows.get(scene) ?? 0) + 1);
  }
  const chooseLine = lines?.get(`choose:${field}`) ?? askLine;
  for (const scene of scenes) {
    if (!rows.has(scene)) throw fail(chooseLine, at(chooseLine, scene), m.scenesNoRows(scene));
    if (!answers.has(scene)) throw fail(chooseLine, at(chooseLine, scene), m.scenesNoAnswer(scene));
  }
}

/**
 * 試す図の宣言を、全ての宣言を読んでから確かめる。最初の step と記法の終わりで 1 度だけ呼び、段の中の出来事を当てる状態を作る。
 * 種類の行の見た目 (`[shape: ]`) は場面の見た目 (`scenes`、#3873) だけを書け、ほかの値は積んだ確かめより先に種類の行を名指して断る
 */
export function settleTry(state: ParseState, head?: SourceLine): void {
  const spec = state.figure.try;
  if (state.kind !== "try" || spec.run) return;
  const shape = state.head.get("shape");
  if (head && shape && shape.value !== "scenes") throw fail(head, valueAt(head, shape), state.m.tryBadShape(shape.value));
  for (const check of spec.pending) check();
  if (head && scenesShape(state)) settleScenes(state, head);
  spec.run = new TryRun({ parts: spec.parts, items: spec.items, checks: spec.checks });
}

/**
 * 段の中の出来事を当てられなかった訳を、行の誤りにする。`chips` は `line` の行のチップか `ask` の行の値の位置、`press` は押した釦。
 * 受け入れない名前 (#3453) は `ask` の行の最初の値 (チップの名前) を名指す
 */
export function faultOf(source: SourceLine, fault: TryFault, state: ParseState, chips: { at: number }[] = [], press = ""): NotationError {
  const { m } = state;
  switch (fault.kind) {
    case "noChip":
      return fail(source, chips[fault.index]?.at ?? 0, m.noSuchItem(fault.item));
    case "twice":
      return fail(source, chips[fault.index]?.at ?? 0, m.itemTwice(fault.item));
    case "elsewhere":
      return fail(source, chips[fault.index]?.at ?? 0, m.chipElsewhere(fault.item, fault.part));
    case "full":
      return fail(source, 0, m.queueFull(fault.part, fault.most));
    case "refused":
      return fail(source, chips[0]?.at ?? 0, m.queueRefuses(fault.part, fault.item));
    case "blockFull":
      return fail(source, 0, m.blockFull(fault.part, fault.most));
    case "empty":
      return fail(source, 0, fault.want === undefined ? m.queueEmpty(fault.part, press) : m.queueShort(fault.part, press, fault.want));
    case "count":
      return fail(source, 0, m.askCount(fault.want));
    case "part":
      return fail(source, 0, m.undeclaredPart(fault.part));
  }
}

/** `from` から行の終わりまでの、`,` で区切った値。値は `"` で囲める */
export function valuesOf(source: SourceLine, from: number, state: ParseState): string[] {
  const { m } = state;
  const text = source.text;
  const values: string[] = [];
  for (let i = from; ; ) {
    const start = skipSpaces(text, i);
    let value: string;
    let end: number;
    if (text[start] === '"') {
      const quoted = readQuoted(source, start, m);
      value = quoted.value;
      end = skipSpaces(text, quoted.end);
      if (end < text.length && text[end] !== ",") throw fail(source, end, m.afterQuote);
    } else {
      const comma = text.indexOf(",", start);
      end = comma < 0 ? text.length : comma;
      value = text.slice(start, end).trim();
    }
    if (value === "") throw fail(source, start, m.askShape);
    values.push(value);
    if (end >= text.length) return values;
    i = end + 1;
  }
}
