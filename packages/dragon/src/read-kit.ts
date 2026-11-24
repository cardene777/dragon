/**
 * 記法を読む下請け (#3345)。
 *
 * 記法を読む処理 (`parser.ts`) と、ブロックの読む処理 (`blocks/<名前>/block.ts`) が共に使う。
 * ブロックは読む処理を読まずにこの file だけを読むので、この file は語の表 (`words.ts`) と原本の形の検査 (`schema.ts`) と
 * 誤りの文の表 (`messages.ts`) を値として読まない。語の表はブロックの一覧から語を集めるため、読むと輪になる。
 * 誤りは行と列を添えた `NotationError` で投げ、`parseNotation` が最初の 1 つで止めて返す。
 */
import type { Messages } from "./messages";
import { columnOf, type SourceLine } from "./tokenize";

/** 行と列を添えた記法の誤り。欄は型を外すだけで読める書き方で持つ (build の時に Node が型を外してこの file を読むため、#3346) */
export class NotationError extends Error {
  readonly line: number;
  readonly column: number;
  constructor(line: number, column: number, message: string) {
    super(message);
    this.line = line;
    this.column = column;
  }
}

export const fail = (source: SourceLine, index: number, message: string): NotationError =>
  new NotationError(source.line, columnOf(source, index), message);

/** 名札に使える字。原本の JSON の名札の形と同じ */
export const ID = /^[^\s[\]「」=:]+$/u;

/** commit と木の箱の hash。原本の JSON の hash の形と同じ。commit のブロックと木の図の読む処理が使う */
export const HASH = /^[0-9a-f]{4,40}$/u;

/** 箱と区画の名札の後ろに、見せる名前を続ける語 (`box <名札> as <名前>`) */
export const AS = "as";

export const isOneOf = <T extends string>(list: readonly T[], word: string): word is T => (list as readonly string[]).includes(word);

/** 誤りの文に、書ける語を ` / ` で区切って並べる */
export const list = (words: readonly string[]): string => words.join(" / ");

/** `at` から空白を飛ばした位置 */
export function skipSpaces(text: string, at: number): number {
  let i = at;
  while (i < text.length && /\s/u.test(text[i] ?? "")) i++;
  return i;
}

/** `[<鍵>: <値>]` の 1 つ。`at` は鍵の位置 */
export interface Attr {
  value: string;
  at: number;
}

/** `at` の `"` から閉じる `"` までを読む。`end` は閉じた `"` の次 */
export function readQuoted(source: SourceLine, at: number, m: Messages): { value: string; end: number } {
  const text = source.text;
  let value = "";
  for (let i = at + 1; i < text.length; i++) {
    const c = text[i] ?? "";
    const next = text[i + 1] ?? "";
    if (c === "\\" && (next === '"' || next === "\\")) {
      value += next;
      i++;
    } else if (c === '"') {
      return { value, end: i + 1 };
    } else {
      value += c;
    }
  }
  throw fail(source, at, m.quoteUnclosed);
}

/**
 * `at` から名前か文を読む。`"` で始まれば囲みの中、そうでなければ `[` の前か行の終わりまで。
 * `rest` は名前の後ろの位置で、行の終わりか属性の `[` を指す。
 */
export function readName(source: SourceLine, at: number, m: Messages): { value: string; rest: number } {
  const text = source.text;
  const start = skipSpaces(text, at);
  if (text[start] === '"') {
    const quoted = readQuoted(source, start, m);
    const rest = skipSpaces(text, quoted.end);
    if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.afterQuote);
    return { value: quoted.value, rest };
  }
  const open = text.indexOf("[", start);
  const rest = open < 0 ? text.length : open;
  return { value: text.slice(start, rest).trim(), rest };
}

/**
 * `at` の `[` から行の終わりの `]` までの属性を読む。`allowed` に無い鍵は誤り。`flags` の鍵は値を持たない印で、`:` を書かずに置き、値は空の字になる。
 * `allowed` を渡さない時はどの鍵も読み、鍵を確かめるのは呼ぶ側に任せる (試す図のチップの欄は、後の行の入力の帯で決まる、#3337)
 */
export function readAttrs(source: SourceLine, at: number, allowed: readonly string[] | undefined, m: Messages, flags: readonly string[] = []): Map<string, Attr> {
  const text = source.text;
  if (!text.endsWith("]")) throw fail(source, at, m.attrUnclosed);
  const close = text.length - 1;
  const attrs = new Map<string, Attr>();
  for (let i = at + 1; ; ) {
    const start = skipSpaces(text, i);
    let colon = start;
    while (colon < close && text[colon] !== ":" && text[colon] !== ",") colon++;
    // 値を持たない印 (配管の図の `[fold]` と `[fail]`、#3389) は、鍵だけを書く
    const bare = text.slice(start, colon).trim();
    if ((colon >= close || text[colon] === ",") && flags.includes(bare)) {
      if (attrs.has(bare)) throw fail(source, start, m.attrTwice(bare));
      attrs.set(bare, { value: "", at: start });
      if (colon >= close) return attrs;
      i = colon + 1;
      continue;
    }
    if (colon >= close || text[colon] !== ":") throw fail(source, start, m.attrNoColon(bare));
    const key = text.slice(start, colon).trim();
    if (allowed && !allowed.includes(key)) throw fail(source, start, m.badAttr(key, allowed));
    if (attrs.has(key)) throw fail(source, start, m.attrTwice(key));
    let end = skipSpaces(text, colon + 1);
    let value: string;
    if (text[end] === '"') {
      const quoted = readQuoted(source, end, m);
      value = quoted.value;
      end = skipSpaces(text, quoted.end);
      if (end < close && text[end] !== ",") throw fail(source, end, m.afterQuote);
    } else {
      const comma = text.indexOf(",", end);
      const stop = comma < 0 || comma > close ? close : comma;
      value = text.slice(end, stop).trim();
      end = stop;
    }
    if (value === "") throw fail(source, start, m.attrNoValue(key));
    attrs.set(key, { value, at: start });
    if (end >= close) return attrs;
    i = end + 1;
  }
}

/** `at` から `,` で区切った字の並びを行の終わりまで読む */
export function readList(source: SourceLine, at: number, m: Messages): string[] {
  const text = source.text;
  const items: string[] = [];
  for (let i = at; ; ) {
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
    if (value === "") throw fail(source, start, m.emptyStripField);
    items.push(value);
    if (end >= text.length) return items;
    i = end + 1;
  }
}

/** `group` と `box` の行の、名札と `as` の後ろの名前と属性 */
export interface Declared {
  id: string;
  idAt: number;
  name?: string;
  attrs: Map<string, Attr>;
}

export function readDeclared(source: SourceLine, word: string, allowed: readonly string[], m: Messages): Declared {
  const text = source.text;
  const start = skipSpaces(text, word.length);
  const id = /^[^\s[]+/u.exec(text.slice(start))?.[0];
  if (id === undefined) throw fail(source, 0, m.needsId(word));
  if (!ID.test(id)) throw fail(source, start, m.badId(id));
  let rest = skipSpaces(text, start + id.length);
  let name: string | undefined;
  if (text.startsWith(AS, rest) && /^(\s|$)/u.test(text.slice(rest + AS.length, rest + AS.length + 1))) {
    const named = readName(source, rest + AS.length, m);
    if (named.value === "") throw fail(source, rest, m.emptyName(id));
    name = named.value;
    rest = named.rest;
  }
  if (rest < text.length && text[rest] !== "[") throw fail(source, rest, m.afterId);
  const attrs = rest < text.length ? readAttrs(source, rest, allowed, m) : new Map<string, Attr>();
  return { id, idAt: start, ...(name !== undefined ? { name } : {}), attrs };
}

/**
 * `act <名札>: <字>` と `note <名札>: <字>` の行の、箱と字。形に合わない行は `shape` の文で断る。
 * `boxAt` は宣言した箱の名札かを確かめる (読んでいる記法の状態の `boxAt`)
 */
export function readOnBox(source: SourceLine, word: string, shape: string, boxAt: (source: SourceLine, id: string, at: number) => string): { box: string; text: string } {
  const found = new RegExp(`^${word}\\s+([^\\s:]+)\\s*:\\s*(.*)$`, "du").exec(source.text);
  const idAt = found?.indices?.[1]?.[0];
  if (!found || idAt === undefined || (found[2] ?? "") === "") throw fail(source, 0, shape);
  return { box: boxAt(source, found[1] ?? "", idAt), text: found[2] ?? "" };
}
