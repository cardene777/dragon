/**
 * 試す図 (#3337) の部品のブロックの読む処理が共に使う下請け (#3348)。
 *
 * 部品を名指す属性と欄を名指す鍵は、全ての宣言を読んでから確かめる (`refer` と `fieldAt` を `figure.try.pending` に積む)。
 * 最初の段を始める時か記法の終わりに積んだ確かめを 1 度だけ回し、段の中の出来事を当てる状態 (`TryRun`) を作る (`settleTry`)。
 * 段の中の出来事を当てられなかった訳は、行の誤りにする (`faultOf`)。
 * 網、待ち行列、機械の列、記録の列、入力の帯、釦のブロックが読み、どれか 1 つのブロックに置くと別のブロックとの間で読み合いの輪になるので、ここに置く。
 * 誤りの文は各ブロックが持つ。
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

/** 試す図の宣言を、全ての宣言を読んでから確かめる。最初の step と記法の終わりで 1 度だけ呼び、段の中の出来事を当てる状態を作る */
export function settleTry(state: ParseState): void {
  const spec = state.figure.try;
  if (state.kind !== "try" || spec.run) return;
  for (const check of spec.pending) check();
  spec.run = new TryRun({ parts: spec.parts, items: spec.items });
}

/** 段の中の出来事を当てられなかった訳を、行の誤りにする。`chips` は `line` の行のチップの位置、`press` は押した釦 */
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
    case "blockFull":
      return fail(source, 0, m.blockFull(fault.part, fault.most));
    case "empty":
      return fail(source, 0, m.queueEmpty(fault.part, press));
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
